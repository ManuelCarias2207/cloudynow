import { createContext, useMemo, useState } from 'react';

export const FlowContext = createContext(null);

/** Keeps the three-step flow: location -> farm (crops + priority) -> results. */
export default function FlowProvider({ children }) {
  const [location, setLocation] = useState(null); // { lat, lon, label }
  const [currentCrops, setCurrentCrops] = useState([]);
  const [priority, setPriority] = useState(null);

  const value = useMemo(
    () => ({ location, setLocation, currentCrops, setCurrentCrops, priority, setPriority }),
    [location, currentCrops, priority],
  );
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}
