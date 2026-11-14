import { useContext } from 'react';
import { FlowContext } from '../state/FlowProvider.jsx';

export function useFlow() {
  const flow = useContext(FlowContext);
  if (!flow) throw new Error('useFlow must be used inside <FlowProvider>.');
  return flow;
}
