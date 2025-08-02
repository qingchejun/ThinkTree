/**
 * 每日奖励Toast组件 - 全局奖励提示
 */
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

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

  if (!showDailyRewardToast || !isClient) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg border border-green-600 max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🎉</div>
          <div>
            <div className="font-semibold">每日登录奖励</div>
            <div className="text-sm opacity-90">+10 积分！</div>
          </div>
          <button
            onClick={() => setShowDailyRewardToast(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
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