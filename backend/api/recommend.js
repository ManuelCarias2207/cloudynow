import { createHandler, sendJson } from '../src/lib/http.js';
import { loadZones, loadCrops } from '../src/data/loadData.js';
import { validateRecommendBody } from '../src/lib/validation.js';
import { recommend } from '../src/scoring/recommend.js';

/** POST /api/recommend -> three scored rotations (A, B, C) with evidence. */
export default createHandler(['POST'], async (req, res) => {
  const input = validateRecommendBody(req.body, { zones: await loadZones(), crops: await loadCrops() });
  sendJson(res, 200, await recommend(input));
});
