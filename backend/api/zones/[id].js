import { createHandler, sendJson, sendError } from '../../src/lib/http.js';
import { findZone } from '../../src/data/loadData.js';
import { zoneDetail } from '../../src/scoring/recommend.js';

/** GET /api/zones/:id -> zone info and monthly climate series for charts. */
export default createHandler(['GET'], async (req, res) => {
  const zone = await findZone(req.query?.id);
  if (!zone) {
    sendError(res, 404, `Zone not found: ${req.query?.id}`);
    return;
  }
  sendJson(res, 200, await zoneDetail(zone));
});
