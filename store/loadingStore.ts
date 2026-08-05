import { create } from 'zustand';

interface LoadingState {
  pendingCount: number;
  increment: () => void;
  decrement: () => void;
}

// Tracks in-flight API requests app-wide so a single global overlay can show
// whenever any (non-silent) request is pending, without every call site
// having to manage its own loading flag.
export const useLoadingStore = create<LoadingState>()((set) => ({
  pendingCount: 0,
  increment: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  decrement: () => set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),
}));
