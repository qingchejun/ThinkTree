/**
 * 注册页面 - ThinkTree v2.0.0
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useAuth } from '../../context/AuthContext'
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator'
import PasswordInput from '../../components/common/PasswordInput'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    invitationCode: '',
    displayName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invitationInfo, setInvitationInfo] = useState(null)
  const [validatingInvitation, setValidatingInvitation] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(null)
  // 安全地使用reCAPTCHA钩子
  let executeRecaptcha = null
  try {
    const recaptchaHook = useGoogleReCaptcha()
    executeRecaptcha = recaptchaHook?.executeRecaptcha
  } catch (error) {
    // 如果没有Provider，executeRecaptcha保持为null
    console.log('reCAPTCHA未配置，跳过人机验证')
  }

  // 从URL参数获取邀请码
  useEffect(() => {
    const invitationCode = searchParams.get('invitation_code')
    if (invitationCode) {
      setFormData(prev => ({
        ...prev,
        invitationCode: invitationCode
      }))
      // 验证邀请码
      validateInvitationCode(invitationCode)
    }
  }, [searchParams])

  // 验证邀请码
  const validateInvitationCode = async (code) => {
    if (!code) return
    
    setValidatingInvitation(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invitations/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()
      
      if (response.ok && data.valid) {
        setInvitationInfo(data.invitation_info)
        setError('')
      } else {
        setError(data.message || '邀请码无效')
        setInvitationInfo(null)
      }
    } catch (err) {
      setError('验证邀请码时出错，请稍后重试')
      setInvitationInfo(null)
    } finally {
      setValidatingInvitation(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 清除错误信息
    if (error) setError('')
    
    // 如果是邀请码输入框，实时验证
    if (name === 'invitationCode' && value.length >= 6) {
      validateInvitationCode(value)
    }
  }

  const validateForm = () => {
    if (!formData.invitationCode) {
      setError('请输入邀请码')
      return false
    }
    if (!invitationInfo) {
      setError('邀请码无效，请检查后重试')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }
    if (!passwordStrength?.is_valid) {
      setError('密码不符合安全要求，请参考密码强度指示器')
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
      // 获取reCAPTCHA令牌
      let recaptchaToken = null
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      
      if (siteKey && executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('register')
        } catch (recaptchaError) {
          console.error('reCAPTCHA执行失败:', recaptchaError)
          setError('人机验证失败，请刷新页面重试')
          setLoading(false)
          return
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          invitation_code: formData.invitationCode,
          display_name: formData.displayName || formData.email.split('@')[0],
          recaptcha_token: recaptchaToken
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 检查是否获得了每日奖励
        let successMessage = '注册成功！验证邮件已发送，正在跳转...'
        if (data.daily_reward_granted) {
          successMessage = '注册成功！每日登录奖励 +10 积分！🎉 验证邮件已发送，正在跳转...'
        }
        setSuccess(successMessage)
        
        // 跳转到邮箱验证提示页面
        setTimeout(() => {
          router.push(`/verify-email-sent?email=${encodeURIComponent(formData.email)}`)
        }, data.daily_reward_granted ? 3000 : 2000) // 如果有奖励，延长显示时间
      } else {
        setError(data.detail || data.message || '注册失败，请稍后重试')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('注册错误:', err)
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
              注册 ThinkSo 账户
            </CardTitle>
            <p className="text-text-secondary">
              使用邀请码创建您的账户，开始使用AI思维导图工具 (v3.2.0)
            </p>
          </CardHeader>

          <CardContent>
            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 邀请码输入框 */}
              <div>
                <label htmlFor="invitationCode" className="block text-sm font-medium text-text-primary mb-2">
                  邀请码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="invitationCode"
                    name="invitationCode"
                    type="text"
                    required
                    value={formData.invitationCode}
                    onChange={handleInputChange}
                    placeholder="请输入6-8位邀请码"
                  />
                  {validatingInvitation && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                    </div>
                  )}
                </div>
                {/* 邀请码验证状态 */}
                {invitationInfo && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <div className="text-green-500 mr-2">✓</div>
                      <div className="text-sm">
                        <p className="text-green-700 font-medium">邀请码有效</p>
                        <p className="text-green-600">
                          来自: {invitationInfo.inviter_email} 
                          {invitationInfo.description && ` • ${invitationInfo.description}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  密码
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                  className="border border-border-primary bg-transparent px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                />
                
                {/* 密码强度指示器 */}
                <PasswordStrengthIndicator 
                  password={formData.password}
                  onStrengthChange={setPasswordStrength}
                />
              </div>

              {/* 确认密码输入框 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                  确认密码
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="请再次输入密码"
                  className="border border-border-primary bg-transparent px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                />
              </div>

              {/* 显示名称输入框 */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2">
                  显示名称 <span className="text-text-tertiary">(可选)</span>
                </label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="请输入您的显示名称"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  不填写将使用邮箱前缀作为显示名称
                </p>
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
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    注册中...
                  </div>
                ) : (
                  '注册账户'
                )}
              </Button>

              {/* 登录链接 */}
              <div className="text-center">
                <p className="text-sm text-text-secondary">
                  已有账户？{' '}
                  <Link href="/login" className="font-medium text-brand-primary hover:underline">
                    立即登录
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

export default function RegisterPage() {
  // 检查是否配置了reCAPTCHA
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  
  const LoadingCard = () => (
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
  )
  
  if (!siteKey) {
    // 如果没有配置reCAPTCHA，直接渲染表单
    return (
      <Suspense fallback={<LoadingCard />}>
        <RegisterForm />
      </Suspense>
    )
  }

  // 如果配置了reCAPTCHA，使用Provider包装
  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <Suspense fallback={<LoadingCard />}>
        <RegisterForm />
      </Suspense>
    </GoogleReCaptchaProvider>
  )
}