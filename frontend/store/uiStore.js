import { create } from 'zustand'

export const useUIStore = create((set) => ({
  toast: null,
  setToast(msg) { set({ toast: msg }) },
  clearToast() { set({ toast: null }) },
  modal: null,
  openModal(payload) { set({ modal: payload }) },
  closeModal() { set({ modal: null }) },
}))

export const uiSelectors = {
  toast: (s) => s.toast,
  modal: (s) => s.modal,
}


