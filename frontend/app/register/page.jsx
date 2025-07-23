/**
 * 注册页面 - ThinkTree v2.0.0
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }
    if (formData.password.length < 6) {
      setError('密码长度至少6位')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 表单验证
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('注册成功！正在自动登录...')
        
        // 注册成功后自动登录
        try {
          // 使用注册时的邮箱和密码自动登录
          const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password
            }),
          })

          const loginData = await loginResponse.json()

          if (loginResponse.ok) {
            // 使用全局AuthContext的login函数
            const loginResult = await login(loginData.access_token)
            
            if (loginResult.success) {
              setSuccess('注册成功！自动登录成功，正在跳转...')
              // 跳转到首页而不是登录页面
              setTimeout(() => {
                router.push('/')
              }, 1500)
            } else {
              // 自动登录失败，跳转到登录页面
              setSuccess('注册成功！请手动登录...')
              setTimeout(() => {
                router.push('/login')
              }, 2000)
            }
          } else {
            // 自动登录失败，跳转到登录页面
            setSuccess('注册成功！请手动登录...')
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          }
        } catch (loginErr) {
          console.error('自动登录失败:', loginErr)
          setSuccess('注册成功！请手动登录...')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } else {
        setError(data.detail || '注册失败，请稍后重试')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('注册错误:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 头部 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              注册 ThinkTree 账户
            </h2>
            <p className="text-gray-600 mb-8">
              创建您的账户，开始使用AI思维导图工具
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入密码（至少6位）"
              />
            </div>

            {/* 确认密码输入框 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请再次输入密码"
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

            {/* 注册按钮 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    注册中...
                  </div>
                ) : (
                  '注册账户'
                )}
              </button>
            </div>

            {/* 登录链接 */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                已有账户？{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  立即登录
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