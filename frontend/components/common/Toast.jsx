/**
 * Toast 通知组件
 */
'use client'

import { useState, useEffect } from 'react'

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  }

  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg p-4 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${typeStyles[type]}`}
    >
      <div className="flex items-center">
        <span className="text-lg mr-3">{icons[type]}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-2 text-white hover:text-gray-200 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Toast 管理器
export class ToastManager {
  static toasts = []
  static listeners = []

  static addToast(message, type = 'info', duration = 3000) {
    const id = Math.random().toString(36).substr(2, 9)
    const toast = { id, message, type, duration }
    
    this.toasts.push(toast)
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
    <div className="fixed top-0 right-0 z-50 p-4 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto mb-2"
          style={{ 
            transform: `translateY(${index * 70}px)` 
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => ToastManager.removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default Toast