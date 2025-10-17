import { create } from 'zustand';
import { connectorMap } from '@/lib/connectors/connectors-config';

interface MCPState {
  activeConnectors: string[];
  connectorData: Record<string, any>;
  toggleConnector: (id: string) => void;
  fetchConnectorData: (id: string) => Promise<any>;
}

export const useMCPStore = create<MCPState>((set) => ({
  activeConnectors: [],
  connectorData: {},
  toggleConnector: (id) => {
    set((state) => {
      const isActive = state.activeConnectors.includes(id);
      const nextActive = isActive
        ? state.activeConnectors.filter((connectorId) => connectorId !== id)
        : [...state.activeConnectors, id];
      const nextData = { ...state.connectorData };
      if (isActive) {
        delete nextData[id];
      }
      return { activeConnectors: nextActive, connectorData: nextData };
    });
  },
  fetchConnectorData: async (id) => {
    const connector = connectorMap[id];
    if (!connector) {
      throw new Error(`Unknown connector: ${id}`);
    }
    let data: any;
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/mcp/${id}`);
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to retrieve connector data');
      }
      const json = await res.json();
      data = Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
      if (data === undefined || data === null) {
        throw new Error('Connector returned no data');
      }
    } else {
      data = await connector.fetchData();
    }
    set((state) => ({
      connectorData: { ...state.connectorData, [id]: data },
      activeConnectors: state.activeConnectors.includes(id)
        ? state.activeConnectors
        : [...state.activeConnectors, id]
    }));
    return data;
  }
}));
