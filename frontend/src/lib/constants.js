// Crop ids must match backend/data/crops.json.
export const CROPS = [
  { id: 'maize', name: 'Maize' },
  { id: 'bean', name: 'Common bean' },
  { id: 'sorghum', name: 'Sorghum' },
  { id: 'sesame', name: 'Sesame' },
  { id: 'cowpea', name: 'Cowpea' },
  { id: 'jack-bean', name: 'Jack bean (canavalia)' },
  { id: 'squash', name: 'Squash (ayote)' },
  { id: 'cassava', name: 'Cassava (yuca)' },
];

export const MAX_CROPS = 4;

export const PRIORITIES = [
  { id: 'water', name: 'Save water', hint: 'Crops that cope with little rain and dry spells.' },
  { id: 'income', name: 'More income', hint: 'Crops with better earning potential and lower risk.' },
  { id: 'soil', name: 'Healthier soil', hint: 'Cover the soil, add nitrogen, reduce erosion.' },
];

export const CRITERIA = ['water', 'soil', 'erosion', 'income', 'risk'];

// Must match EL_SALVADOR_BOUNDS in backend/src/lib/validation.js.
export const EL_SALVADOR_BOUNDS = { minLat: 13.1, maxLat: 14.5, minLon: -90.2, maxLon: -87.6 };

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
export const MAP_CENTER = [-88.9, 13.75];
