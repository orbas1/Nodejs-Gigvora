import { useMemo } from 'react';
import useIntegrationControlTower from './useIntegrationControlTower.js';

export default function useCrmIntegrationManager(options = {}) {
  const state = useIntegrationControlTower(options);
  const managedConnectors = useMemo(
    () => (state.connectors ?? []).filter((connector) => connector?.isManaged),
    [state.connectors],
  );

  return {
    ...state,
    managedConnectors,
  };
}
