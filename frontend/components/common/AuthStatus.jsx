/**
 * 认证状态调试组件 - 用于测试AuthContext
 */
'use client'

import { useAuth } from '../../context/AuthContext'

export default function AuthStatus() {
  const { user, token, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        认证状态检查中...
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded max-w-sm">
      <h4 className="font-bold">认证状态调试</h4>
      <div className="text-sm mt-2">
        <p><strong>认证状态:</strong> {isAuthenticated ? '已认证' : '未认证'}</p>
        <p><strong>用户邮箱:</strong> {user?.email || '无'}</p>
        <p><strong>令牌:</strong> {token ? '存在' : '无'}</p>
        <p><strong>用户ID:</strong> {user?.id || '无'}</p>
      </div>
    </div>
  )
}