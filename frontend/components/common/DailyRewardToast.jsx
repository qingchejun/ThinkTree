/**
 * 每日奖励Toast组件 - 全局奖励提示
 */
'use client'

import { useAuth } from '../../context/AuthContext'

export function DailyRewardToast() {
  const { showDailyRewardToast, setShowDailyRewardToast } = useAuth()

  if (!showDailyRewardToast) {
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

// 如果使用CSS-in-JS，在document头部插入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}