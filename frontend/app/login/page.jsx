/**
 * 登录页面 - ThinkSo v2.0.0
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationSuccess, setVerificationSuccess] = useState(false)

  // 检查是否从邮箱验证页面跳转过来
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setVerificationSuccess(true)
      setSuccess('邮箱验证成功！现在您可以登录使用所有功能了。')
    }
  }, [searchParams])

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
      // 设置请求超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // 尝试解析错误响应
        let errorMessage = '登录失败，请检查您的邮箱和密码'
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
        } catch (parseError) {
          // 如果无法解析JSON，使用默认错误信息
          if (response.status === 401) {
            errorMessage = '邮箱或密码错误'
          } else if (response.status >= 500) {
            errorMessage = '服务器暂时不可用，请稍后重试'
          }
        }
        setError(errorMessage)
        return
      }

      const data = await response.json()

      setSuccess('登录成功！正在跳转...')
      
      // 使用全局AuthContext的login函数
      const loginResult = await login(data.access_token)
      
      if (loginResult.success) {
        // 登录成功，检查是否有重定向参数
        const redirectUrl = searchParams.get('redirect') || '/'
        setTimeout(() => {
          router.push(redirectUrl)
        }, 1500)
      } else {
        setError(loginResult.error || '登录处理失败')
      }
    } catch (err) {
      console.error('登录错误:', err)
      
      // 具体的错误处理
      if (err.name === 'AbortError') {
        setError('请求超时，请检查网络连接后重试')
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('无法连接到服务器，请检查网络连接')
      } else {
        setError('网络错误，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-text-primary mb-2">
              登录到 ThinkSo
            </CardTitle>
            <p className="text-text-secondary">
              使用您的账户登录访问思维导图工具
            </p>
          </CardHeader>

          <CardContent>
            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 邮箱输入框 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  邮箱地址
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="请输入您的邮箱"
                />
              </div>

              {/* 密码输入框 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                    密码
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-brand-primary hover:underline"
                  >
                    忘记密码？
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
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
                <div className={`px-4 py-3 rounded-md text-sm ${
                  verificationSuccess 
                    ? 'bg-blue-50 border border-blue-200 text-blue-600' 
                    : 'bg-green-50 border border-green-200 text-green-600'
                }`}>
                  {verificationSuccess && (
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">🎉</span>
                      <span className="font-medium">账户激活成功！</span>
                    </div>
                  )}
                  {success}
                </div>
              )}

              {/* 登录按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    登录中...
                  </div>
                ) : (
                  '登录'
                )}
              </Button>

              {/* 注册链接 */}
              <div className="text-center">
                <p className="text-sm text-text-secondary">
                  还没有账户？{' '}
                  <Link href="/register" className="font-medium text-brand-primary hover:underline">
                    立即注册
                  </Link>
                </p>
              </div>
            </form>

            {/* 返回首页 */}
            <div className="text-center mt-6 pt-6 border-t border-border-secondary">
              <Link href="/" className="text-sm text-text-tertiary hover:text-text-secondary">
                ← 返回首页
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}