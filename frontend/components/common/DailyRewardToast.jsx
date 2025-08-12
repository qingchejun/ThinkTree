/**
 * 每日奖励Toast组件 - 全局奖励提示
 */
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ToastManager } from './Toast'

export function DailyRewardToast() {
  const { showDailyRewardToast, setShowDailyRewardToast } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // 初始化客户端状态和样式注入
  useEffect(() => {
    setIsClient(true)
    
    // 注入样式到文档头部
    if (typeof document !== 'undefined') {
      const styleId = 'daily-reward-toast-styles'
      // 检查是否已经添加了样式
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style')
        styleElement.id = styleId
        styleElement.textContent = styles
        document.head.appendChild(styleElement)
      }
    }
  }, [])

  // 如果关闭展示开关，直接不显示
  if (!isClient) return null
  if (!showDailyRewardToast) return null

  // 收敛为全局 Toast 的一次性提示（轻量），并触发积分角标闪现事件
  try {
    ToastManager.success('每日登录奖励 +10', 1200)
  } catch {}
  // 触发全局事件让 Navbar 的积分角标做闪现动画（可选监听）
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('credits:delta', { detail: { delta: +10, source: 'daily-reward' } }))
  }
  // 只显示一次
  setTimeout(() => setShowDailyRewardToast(false), 0)
  return null
}

// 添加动画样式
const styles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`

// 样式现在通过组件内的useEffect注入，避免SSR问题