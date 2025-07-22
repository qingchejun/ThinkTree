/**
 * 登录页面 - ThinkTree v2.0.0
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 清除错误信息
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('登录成功！正在跳转...')
        
        // 使用全局AuthContext的login函数
        console.log('调用全局login函数，token:', data.access_token?.substring(0, 20) + '...')
        const loginResult = await login(data.access_token)
        console.log('login函数返回结果:', loginResult)
        
        if (loginResult.success) {
          // 登录成功，跳转到控制台
          console.log('登录成功，准备跳转到dashboard')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } else {
          setError(loginResult.error || '登录处理失败')
        }
      } else {
        setError(data.detail || '登录失败，请检查您的邮箱和密码')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('登录错误:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 头部 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              登录到 ThinkTree
            </h2>
            <p className="text-gray-600 mb-8">
              使用您的账户登录访问思维导图工具
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入框 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="请输入您的邮箱"
              />
            </div>

            {/* 密码输入框 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="请输入您的密码"
              />
            </div>

            {/* 错误/成功信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            {/* 登录按钮 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    登录中...
                  </div>
                ) : (
                  '登录'
                )}
              </button>
            </div>

            {/* 注册链接 */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                还没有账户？{' '}
                <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                  立即注册
                </Link>
              </p>
            </div>
          </form>

          {/* 返回首页 */}
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}