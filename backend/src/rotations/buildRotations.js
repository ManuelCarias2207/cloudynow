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

/** Crop replaced in C: the thirstiest one (highest water demand, then lowest drought tolerance). */
export function pickCropToReplace(current) {
  const [thirstiest] = rankBy(current, (crop) => LEVEL[crop.waterDemand], (crop) => -LEVEL[crop.droughtTolerance]);
  return thirstiest;
}

/**
 * Substitute for C: a crop not in the rotation and not the B cover crop, with the highest
 * drought tolerance, then income potential, then lowest water demand. Crops whose cycle fits
 * in the replaced crop's season (cycleMonths <= replaced) are preferred.
 */
export function pickDroughtSubstitute(current, crops, replaced, excluded) {
  const candidates = crops.filter((crop) => !current.includes(crop) && crop !== excluded);
  const fitting = candidates.filter((crop) => crop.cycleMonths <= replaced.cycleMonths);
  const pool = fitting.length > 0 ? fitting : candidates;
  const [best] = rankBy(
    pool,
    (crop) => LEVEL[crop.droughtTolerance],
    (crop) => LEVEL[crop.incomePotential],
    (crop) => -LEVEL[crop.waterDemand],
  );
  if (!best) throw new Error('No drought-tolerant substitute available for rotation C.');
  return best;
}

/** Returns exactly three rotations [A, B, C] built from the current crop ids. */
export function buildRotations(currentIds, crops) {
  const current = resolveCrops(currentIds, crops);
  const cover = pickCoverCrop(current, crops);
  const replaced = pickCropToReplace(current);
  const substitute = pickDroughtSubstitute(current, crops, replaced, cover);
  return [
    { id: 'A', name: 'Current rotation', crops: current, coversBareWindow: false },
    { id: 'B', name: 'Current rotation + cover crop', crops: [...current, cover], coversBareWindow: true, added: cover },
    {
      id: 'C',
      name: 'Drought-tolerant swap',
      crops: current.map((crop) => (crop === replaced ? substitute : crop)),
      coversBareWindow: false,
      swap: { from: replaced, to: substitute },
    },
  ];
}
