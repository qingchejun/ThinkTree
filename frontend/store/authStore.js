import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  userId: null,
  isAuthenticated: false,
  setAuthenticated(user) {
    set({ userId: user?.id || null, isAuthenticated: !!user })
  },
  clear() {
    set({ userId: null, isAuthenticated: false })
  },
}))

export const authSelectors = {
  userId: (s) => s.userId,
  isAuthenticated: (s) => s.isAuthenticated,
}


