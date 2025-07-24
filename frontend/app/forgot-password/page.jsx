/**
 * 忘记密码页面 - ThinkTree
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ToastManager } from '../../components/common/Toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      ToastManager.error('请输入您的邮箱地址')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        ToastManager.success('重置链接已发送')
      } else {
        ToastManager.error(data.detail || '请求失败，请稍后重试')
      }
    } catch (error) {
      console.error('发送密码重置请求失败:', error)
      ToastManager.error('网络错误，请检查您的网络连接')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                重置链接已发送
              </h2>
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  我们已向 <strong className="text-indigo-600">{email}</strong> 发送了密码重置链接。
                </p>
                <p>
                  请检查您的邮箱（包括垃圾邮件文件夹），并点击邮件中的链接重置密码。
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex">
                    <div className="text-yellow-600 text-lg mr-3">⚠️</div>
                    <div className="text-yellow-800 text-sm">
                      <p className="font-medium mb-1">重要提醒：</p>
                      <ul className="text-xs space-y-1">
                        <li>• 重置链接仅在 15 分钟内有效</li>
                        <li>• 链接只能使用一次</li>
                        <li>• 如果没有收到邮件，请检查垃圾邮件文件夹</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium"
                >
                  重新发送
                </button>
                
                <Link
                  href="/login"
                  className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium text-center"
                >
                  返回登录
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-indigo-600">🧠 ThinkSo</h1>
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              忘记密码？
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              输入您的邮箱地址，我们将发送密码重置链接给您。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="请输入您的注册邮箱"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发送中...
                </>
              ) : (
                '📧 发送重置链接'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                ← 返回登录
              </Link>
            </div>
            
            <div className="text-center">
              <span className="text-gray-500 text-sm">还没有账户？</span>
              <Link
                href="/register"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium ml-1"
              >
                立即注册
              </Link>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>重置链接将在 15 分钟后过期</p>
          </div>
        </div>
      </div>
    </div>
  )
}