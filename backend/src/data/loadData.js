const zonesFile = require('../../data/zones.json');
const climateFile = require('../../data/climate_summary.json');
const cropsFile = require('../../data/crops.json');

const zonesById = new Map(zonesFile.zones.map((zone) => [zone.id, zone]));
const cropsById = new Map(cropsFile.crops.map((crop) => [crop.id, crop]));
const systemsById = new Map(cropsFile.currentSystems.map((system) => [system.id, system]));

module.exports = {
  getZones: () => zonesFile.zones,
  getZone: (id) => zonesById.get(id) || null,
  getClimate: (zoneId) => climateFile.zones[zoneId] || null,
  getClimateMeta: () => ({ generatedAt: climateFile.generatedAt, units: climateFile.units }),
  getCrops: () => cropsFile.crops,
  getCrop: (id) => cropsById.get(id) || null,
  getCurrentSystems: () => cropsFile.currentSystems,
  getCurrentSystem: (id) => systemsById.get(id) || null,
  getStrategyCandidates: () => cropsFile.strategyCandidates,
  getTraitDescriptions: () => cropsFile.traits,
};
