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
    // 场景化封装
    networkError: (message = '网络异常，请稍后重试') => push('error', message, defaultDurations.error),
    httpError: (status, fallback = '请求失败') => push('error', `${fallback} (${status})`, defaultDurations.error),
    apiError: (detail) => push('error', typeof detail === 'string' ? detail : (detail?.message || '请求失败'), defaultDurations.error),
    insufficientCredits: (required, current) => {
      const shortfall = Math.max(0, (required ?? 0) - (current ?? 0))
      return push('warning', `积分不足，缺少 ${shortfall} 积分`, 2000)
    },
    saved: (message = '已保存') => push('success', message, 1200),
    copied: (message = '已复制') => push('success', message, 1000),
  }
}

export default useToast


