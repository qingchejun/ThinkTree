'use client'

import { ToastManager } from '../components/common/Toast'

const defaultDurations = {
  success: 1200,
  info: 1600,
  warning: 2000,
  error: 4000,
}

export function useToast() {
  const push = (type, message, duration) => {
    const ms = typeof duration === 'number' ? duration : defaultDurations[type] || 1600
    return ToastManager.addToast(message, type, ms)
  }

  return {
    success: (message, duration) => push('success', message, duration),
    info: (message, duration) => push('info', message, duration),
    warning: (message, duration) => push('warning', message, duration),
    error: (message, duration) => push('error', message, duration),
  }
}

export default useToast


