// Builds the three rotations compared for every request:
// A = current rotation, B = current + cover/legume in the bare window, C = drought-tolerant swap.
import { LEVEL } from '../scoring/engine.js';

/** Maps crop ids to crop objects; throws on unknown ids. */
export function resolveCrops(ids, crops) {
  return ids.map((id) => {
    const crop = crops.find((candidate) => candidate.id === id);
    if (!crop) throw new Error(`Unknown crop: ${id}`);
    return crop;
  });
}

/** Sorts a copy of `list` by several numeric keys (first key wins, higher first). */
function rankBy(list, ...keys) {
  return [...list].sort((a, b) => {
    for (const key of keys) {
      const diff = key(b) - key(a);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

/**
 * Cover crop for B: a nitrogen-fixing crop not already in the rotation,
 * with the most soil cover, then the lowest water demand.
 */
export function pickCoverCrop(current, crops) {
  const candidates = crops.filter((crop) => crop.fixesNitrogen && !current.includes(crop));
  const [best] = rankBy(candidates, (crop) => LEVEL[crop.soilCover], (crop) => -LEVEL[crop.waterDemand]);
  if (!best) throw new Error('No cover crop available for rotation B.');
  return best;
}

/** Current crops from thirstiest to least thirsty (highest water demand, then lowest drought tolerance). */
function rankByThirst(current) {
  return rankBy(current, (crop) => LEVEL[crop.waterDemand], (crop) => -LEVEL[crop.droughtTolerance]);
}

/** Crop replaced in C: the thirstiest one (highest water demand, then lowest drought tolerance). */
export function pickCropToReplace(current) {
  return rankByThirst(current)[0];
}

/**
 * true when `candidate` copes with drought better than `replaced`: higher drought tolerance,
 * or the same tolerance with lower water demand. A swap that is not better is never offered.
 */
export function isMoreDroughtProof(candidate, replaced) {
  const tolerance = LEVEL[candidate.droughtTolerance] - LEVEL[replaced.droughtTolerance];
  if (tolerance !== 0) return tolerance > 0;
  return LEVEL[candidate.waterDemand] < LEVEL[replaced.waterDemand];
}

/**
 * Substitute for C: a crop not in the rotation and not the B cover crop that is more drought-proof
 * than the replaced crop. Ranked by drought tolerance, then keeping nitrogen fixation when the
 * replaced crop was the rotation's only fixer, then income potential, then lowest water demand.
 * Crops whose cycle fits in the replaced crop's season (cycleMonths <= replaced) are preferred.
 * Returns null when no crop improves on the replaced one.
 */
export function pickDroughtSubstitute(current, crops, replaced, excluded) {
  const candidates = crops.filter((crop) => !current.includes(crop) && crop !== excluded && isMoreDroughtProof(crop, replaced));
  const fitting = candidates.filter((crop) => crop.cycleMonths <= replaced.cycleMonths);
  const pool = fitting.length > 0 ? fitting : candidates;
  const losesOnlyFixer = replaced.fixesNitrogen && !current.some((crop) => crop !== replaced && crop.fixesNitrogen);
  const [best] = rankBy(
    pool,
    (crop) => LEVEL[crop.droughtTolerance],
    (crop) => (losesOnlyFixer && crop.fixesNitrogen ? 1 : 0),
    (crop) => LEVEL[crop.incomePotential],
    (crop) => -LEVEL[crop.waterDemand],
  );
  return best ?? null;
}

/**
 * Rotation C: swaps the thirstiest crop that has a more drought-proof substitute. When every crop
 * is already as drought-proof as the catalogue allows, C keeps the current crops and has no swap.
 */
export function buildDroughtRotation(current, crops, cover) {
  for (const replaced of rankByThirst(current)) {
    const substitute = pickDroughtSubstitute(current, crops, replaced, cover);
    if (substitute) {
      return {
        id: 'C',
        name: 'Drought-tolerant swap',
        crops: current.map((crop) => (crop === replaced ? substitute : crop)),
        coversBareWindow: false,
        swap: { from: replaced, to: substitute },
      };
    }
  }
  return { id: 'C', name: 'Already drought-tolerant (no swap)', crops: current, coversBareWindow: false, swap: null, noSwap: true };
}

/** Returns exactly three rotations [A, B, C] built from the current crop ids. */
export function buildRotations(currentIds, crops) {
  const current = resolveCrops(currentIds, crops);
  const cover = pickCoverCrop(current, crops);
  return [
    { id: 'A', name: 'Current rotation', crops: current, coversBareWindow: false },
    { id: 'B', name: 'Current rotation + cover crop', crops: [...current, cover], coversBareWindow: true, added: cover },
    buildDroughtRotation(current, crops, cover),
  ];
}
