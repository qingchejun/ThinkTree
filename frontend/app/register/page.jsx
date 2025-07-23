/**
 * 注册页面 - ThinkTree v2.0.0
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
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
    if (formData.password.length < 8) {
      setError('密码长度至少8位')
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
          password: formData.password,
          invitation_code: formData.invitationCode,
          display_name: formData.displayName || formData.email.split('@')[0]
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('注册成功！验证邮件已发送，正在跳转...')
        
        // 跳转到邮箱验证提示页面
        setTimeout(() => {
          router.push(`/verify-email-sent?email=${encodeURIComponent(formData.email)}`)
        }, 2000)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 头部 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              注册 ThinkTree 账户
            </h2>
            <p className="text-gray-600 mb-8">
              使用邀请码创建您的账户，开始使用AI思维导图工具 (v3.2.0)
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邀请码输入框 */}
            <div>
              <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 mb-2">
                邀请码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="invitationCode"
                  name="invitationCode"
                  type="text"
                  required
                  value={formData.invitationCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入6-8位邀请码"
                />
                {validatingInvitation && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
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
                placeholder="请输入密码（至少8位）"
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

            {/* 显示名称输入框 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                显示名称 <span className="text-gray-400">(可选)</span>
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入您的显示名称"
              />
              <p className="mt-1 text-xs text-gray-500">
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