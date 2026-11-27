import { create } from 'zustand';

export type PrimaryTab = 'home' | 'workout' | 'nutrition' | 'progress' | 'ai';
export type SubView =
  | null
  | 'profile'
  | 'calculators'
  | 'library'
  | 'activity'
  | 'goals'
  | 'recovery'
  | 'planning'
  | 'backup'
  | 'settings';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface AppState {
  activeTab: PrimaryTab;
  subView: SubView;
  sidebarCollapsed: boolean;
  isOnline: boolean;
  showOnboarding: boolean;
  toasts: ToastMessage[];
  setActiveTab: (tab: PrimaryTab, subView?: SubView) => void;
  setSubView: (subView: SubView) => void;
  toggleSidebar: () => void;
  setIsOnline: (online: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  subView: null,
  sidebarCollapsed: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  showOnboarding: false,
  toasts: [],
  setActiveTab: (tab, subView = null) => set({ activeTab: tab, subView }),
  setSubView: (subView) => set({ subView }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setIsOnline: (isOnline) => set({ isOnline }),
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
