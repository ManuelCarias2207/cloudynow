import { createHandler, sendJson } from '../../src/lib/http.js';
import { loadZones } from '../../src/data/loadData.js';

/** GET /api/zones -> [{ id, name, lat, lon }] */
export default createHandler(['GET'], async (req, res) => {
  sendJson(res, 200, await loadZones());
});
