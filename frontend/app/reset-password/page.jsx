/**
 * 密码重置页面 - ThinkTree
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ToastManager } from '../../components/common/Toast'
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(null)

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (!urlToken) {
      setTokenError('缺少重置令牌')
    } else {
      setToken(urlToken)
    }
  }, [searchParams])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validatePassword = (password) => {
    if (!passwordStrength?.is_valid) {
      return '密码不符合安全要求，请参考密码强度指示器'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!token) {
      ToastManager.error('重置令牌无效')
      return
    }

    const { newPassword, confirmPassword } = formData

    // 密码验证
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      ToastManager.error(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      ToastManager.error('两次输入的密码不一致')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        ToastManager.success('密码重置成功！')
        // 3秒后跳转到登录页
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        ToastManager.error(data.detail || '密码重置失败')
      }
    } catch (error) {
      console.error('密码重置失败:', error)
      ToastManager.error('网络错误，请检查您的网络连接')
    } finally {
      setLoading(false)
    }
  }

  // Token错误页面
  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                重置链接无效
              </h2>
              <div className="text-sm text-gray-600 space-y-3">
                <p>重置链接可能已过期或无效。</p>
                <p>请重新申请密码重置。</p>
              </div>
              
              <div className="mt-6 space-y-3">
                <Link
                  href="/forgot-password"
                  className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium text-center"
                >
                  重新申请密码重置
                </Link>
                
                <Link
                  href="/login"
                  className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium text-center"
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

  // 成功页面
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                密码重置成功！
              </h2>
              <div className="text-sm text-gray-600 space-y-3">
                <p>您的密码已成功重置。</p>
                <p>现在可以使用新密码登录了。</p>
                <p className="text-indigo-600 font-medium">3秒后自动跳转到登录页面...</p>
              </div>
              
              <div className="mt-6">
                <Link
                  href="/login"
                  className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium text-center"
                >
                  立即登录
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 密码重置表单
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-indigo-600">🌳 ThinkTree</h1>
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              重置密码
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              请输入您的新密码
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="请输入新密码"
                required
              />
              
              {/* 密码强度指示器 */}
              <PasswordStrengthIndicator 
                password={formData.newPassword}
                onStrengthChange={setPasswordStrength}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认新密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="请再次输入新密码"
                required
              />
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">两次输入的密码不一致</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword || !passwordStrength?.is_valid}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  重置中...
                </>
              ) : (
                '🔑 重置密码'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              ← 返回登录
            </Link>
          </div>

          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>重置链接在15分钟后过期</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}