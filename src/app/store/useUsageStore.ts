import { create } from 'zustand';

export interface UsageStats {
  dailyRequests: Record<string, number>;
  dailyTokens: Record<string, number>;
  totalRequests: number;
  totalTokens: number;
  maxDailyRequests: number;
  maxDailyTokens: number;
}

interface UsageState {
  stats: UsageStats;
  initialize: () => void;
  addUsage: (promptCharCount: number, responseTextCharCount: number) => void;
  setDailyLimits: (requests: number, tokens: number) => void;
  resetStats: () => void;
}

const DEFAULT_STATS: UsageStats = {
  dailyRequests: {},
  dailyTokens: {},
  totalRequests: 0,
  totalTokens: 0,
  maxDailyRequests: 100,
  maxDailyTokens: 100000
};

export const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useUsageStore = create<UsageState>((set, get) => ({
  stats: DEFAULT_STATS,

  initialize: () => {
    try {
      const saved = localStorage.getItem('gemma_usage_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        set({
          stats: {
            ...DEFAULT_STATS,
            ...parsed
          }
        });
      }
    } catch (e) {
      console.error('Failed to load usage stats from storage', e);
    }
  },

  addUsage: (promptCharCount, responseTextCharCount) => {
    // Standard fast client-side approximation (1 token ≈ 4 characters)
    const promptTokens = Math.max(1, Math.ceil(promptCharCount / 4));
    const responseTokens = Math.max(1, Math.ceil(responseTextCharCount / 4));
    const combinedTokens = promptTokens + responseTokens;

    const today = getTodayKey();
    const current = get().stats;

    const newDailyRequests = { ...current.dailyRequests };
    newDailyRequests[today] = (newDailyRequests[today] || 0) + 1;

    const newDailyTokens = { ...current.dailyTokens };
    newDailyTokens[today] = (newDailyTokens[today] || 0) + combinedTokens;

    const updatedStats: UsageStats = {
      ...current,
      dailyRequests: newDailyRequests,
      dailyTokens: newDailyTokens,
      totalRequests: current.totalRequests + 1,
      totalTokens: current.totalTokens + combinedTokens
    };

    set({ stats: updatedStats });
    localStorage.setItem('gemma_usage_stats', JSON.stringify(updatedStats));
  },

  setDailyLimits: (requests, tokens) => {
    const updatedStats = {
      ...get().stats,
      maxDailyRequests: requests,
      maxDailyTokens: tokens
    };
    set({ stats: updatedStats });
    localStorage.setItem('gemma_usage_stats', JSON.stringify(updatedStats));
  },

  resetStats: () => {
    set({ stats: DEFAULT_STATS });
    localStorage.setItem('gemma_usage_stats', JSON.stringify(DEFAULT_STATS));
  }
}));
