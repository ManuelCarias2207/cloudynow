// Crop ids must match backend/data/crops.json.
// Labels live in src/i18n (crops.<id>, priorities.<id>).
export const CROPS = ['maize', 'bean', 'sorghum', 'sesame', 'cowpea', 'jack-bean', 'squash', 'cassava'];

export const MAX_CROPS = 4;

export const PRIORITIES = ['water', 'income', 'soil'];

export const CRITERIA = ['water', 'soil', 'erosion', 'income', 'risk'];

// Must match EL_SALVADOR_BOUNDS in backend/src/lib/validation.js.
export const EL_SALVADOR_BOUNDS = { minLat: 13.1, maxLat: 14.5, minLon: -90.2, maxLon: -87.6 };

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
export const MAP_CENTER = [-88.9, 13.75];

// Optional satellite layer, only requested when the user turns it on.
export const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_ATTRIBUTION = 'Imagery © Esri, Maxar, Earthstar Geographics';
