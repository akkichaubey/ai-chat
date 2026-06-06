import { create } from 'zustand';
import { AVAILABLE_MODELS } from '../components/ChatArea';

export interface ModelHealth {
  status: 'healthy' | 'untested' | 'failed';
  latency?: number;
  error?: string;
  lastChecked?: number;
  checkedKey?: string;
}

interface ModelMonitorState {
  healthMap: Record<string, ModelHealth>;
  isVerifying: Record<string, boolean>;
  checkModel: (provider: string, model: string, apiKey: string) => Promise<void>;
  checkAllForProvider: (provider: string, apiKey: string) => Promise<void>;
}

export const useModelMonitorStore = create<ModelMonitorState>((set, get) => ({
  healthMap: {},
  isVerifying: {},

  checkModel: async (provider, model, apiKey) => {
    // Avoid double checking same model simultaneously
    if (get().isVerifying[model]) return;

    // Skip verification if already healthy for this key and checked within last 5 minutes
    const existing = get().healthMap[model];
    if (
      existing &&
      existing.status === 'healthy' &&
      existing.checkedKey === apiKey &&
      existing.lastChecked &&
      Date.now() - existing.lastChecked < 5 * 60 * 1000
    ) {
      return;
    }

    set((state) => ({
      isVerifying: { ...state.isVerifying, [model]: true }
    }));

    try {
      const response = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey })
      });

      const data = await response.json();

      set((state) => {
        const updatedHealth: ModelHealth = data.healthy
          ? { status: 'healthy', latency: data.latency, lastChecked: Date.now(), checkedKey: apiKey }
          : { status: 'failed', error: data.error || 'Connection Failed', latency: data.latency, lastChecked: Date.now(), checkedKey: apiKey };

        return {
          healthMap: { ...state.healthMap, [model]: updatedHealth },
          isVerifying: { ...state.isVerifying, [model]: false }
        };
      });
    } catch (err) {
      const e = err as Error;
      set((state) => ({
        healthMap: {
          ...state.healthMap,
          [model]: { status: 'failed', error: e.message, lastChecked: Date.now(), checkedKey: apiKey }
        },
        isVerifying: { ...state.isVerifying, [model]: false }
      }));
    }
  },

  checkAllForProvider: async (provider, apiKey) => {
    const modelsToCheck = AVAILABLE_MODELS.filter((m) => m.provider === provider);
    
    // Check models in parallel
    await Promise.all(
      modelsToCheck.map((m) => get().checkModel(provider, m.id, apiKey))
    );
  }
}));
