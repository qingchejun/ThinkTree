/**
 * Toast 通知组件
 */
'use client'

import React, { useState, useEffect, useRef } from 'react'

const Toast = ({ message, type = 'info', duration, onClose, count = 1 }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const remainingRef = useRef(duration)

  // 默认时长（进一步收紧）
  const defaultDurations = {
    success: 1200,
    info: 1600,
    warning: 2000,
    error: 0, // 不自动消失
  }
  const finalDuration = typeof duration === 'number' ? duration : defaultDurations[type] ?? 1600

  useEffect(() => {
    remainingRef.current = finalDuration
    if (finalDuration > 0) startTimer()
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalDuration])

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }
  const startTimer = () => {
    if (paused || finalDuration <= 0) return
    startedAtRef.current = Date.now()
    clearTimer()
    timerRef.current = setTimeout(() => handleClose(), remainingRef.current)
  }
  const pauseTimer = () => {
    if (finalDuration <= 0) return
    setPaused(true)
    clearTimer()
    const elapsed = Date.now() - startedAtRef.current
    remainingRef.current = Math.max(0, remainingRef.current - elapsed)
  }
  const resumeTimer = () => {
    if (finalDuration <= 0) return
    setPaused(false)
    startTimer()
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 180)
  }

  const typeStyles = {
    success: 'bg-success-50 text-success-700 border border-success-100',
    error: 'bg-error-50 text-error-700 border border-error-100',
    warning: 'bg-warning-50 text-warning-700 border border-warning-100',
    info: 'bg-info-50 text-info-700 border border-info-100'
  }

  const icons = {
    success: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
    ),
    error: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    ),
    warning: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    ),
    info: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    )
  }

  return (
    <div
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      className={`shadow-md rounded-lg px-3 py-2 transition-all duration-200 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      } ${typeStyles[type]} min-w-[240px] max-w-[320px]`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 opacity-80">{icons[type]}</span>
        <p className="flex-1 text-[13px] leading-snug whitespace-pre-line">
          {message}{count > 1 ? ` ×${count}` : ''}
        </p>
        <button onClick={handleClose} className="ml-1 text-slate-500 hover:text-slate-700" aria-label="关闭">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  )
}

// Toast 管理器
export class ToastManager {
  static toasts = []
  static listeners = []
  static lastAddAt = 0

  static addToast(message, type = 'info', duration) {
    const now = Date.now()
    // 800ms 内同文案同类型去重，或合并计数
    const existing = this.toasts.find(t => t.message === message && t.type === type)
    if (existing) {
      existing.count = (existing.count || 1) + 1
      this.notifyListeners()
      return existing.id
    }
    if (now - this.lastAddAt < 200 && this.toasts.length > 0) {
      // 轻度限流，避免瞬时多条
    }
    const id = Math.random().toString(36).slice(2)
    const toast = { id, message, type, duration, count: 1 }
    this.toasts.push(toast)
    this.lastAddAt = now
    this.notifyListeners()
    
    return id
  }

  static removeToast(id) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notifyListeners()
  }

  static subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  static notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts))
  }

  static success(message, duration) {
    return this.addToast(message, 'success', duration)
  }

  static error(message, duration) {
    return this.addToast(message, 'error', duration)
  }

  static warning(message, duration) {
    return this.addToast(message, 'warning', duration)
  }

  static info(message, duration) {
    return this.addToast(message, 'info', duration)
  }
}

// Toast 容器组件
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe(setToasts)
    return unsubscribe
  }, [])

  return (
    <div className="fixed z-50 p-4 pointer-events-none right-0 top-16 sm:top-4 sm:right-4 left-auto">
      {(toasts.slice(0, 2)).map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto mb-2 flex justify-end"
          style={{ transform: `translateY(${index * 56}px)` }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            count={toast.count}
            onClose={() => ToastManager.removeToast(toast.id)}
          />
        </div>
      ))}
      {/* 移动端底部中间显示 */}
      <div className="sm:hidden fixed inset-x-0 bottom-3 flex justify-center pointer-events-none">
        {toasts.length > 0 && (
          <div className="pointer-events-auto">
            <Toast
              message={toasts[0].message}
              type={toasts[0].type}
              duration={toasts[0].duration}
              count={toasts[0].count}
              onClose={() => ToastManager.removeToast(toasts[0].id)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Toast