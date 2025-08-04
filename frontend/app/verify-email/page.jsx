/**
 * 邮箱验证页面 - ThinkSo v3.2.0
 */
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      verifyEmail(token)
    } else {
      setError('验证链接无效，缺少验证令牌')
      setVerifying(false)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const verifyEmail = async (token) => {
    try {
      setVerifying(true)
      setError('')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setUserInfo(data.user)
        
        // 3秒后自动跳转到登录页面
        setTimeout(() => {
          router.push('/?auth=login&verified=true')
        }, 3000)
      } else {
        setError(data.message || '邮箱验证失败，请稍后重试')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('邮箱验证错误:', err)
    } finally {
      setVerifying(false)
    }
  }

  // 加载状态
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* 加载动画 */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              正在验证邮箱
            </h2>
            <p className="text-gray-600">
              请稍候，我们正在验证您的邮箱地址...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 验证成功
  if (success && userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* 成功图标 */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <div className="text-green-500 text-3xl">🎉</div>
            </div>

            {/* 标题 */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              邮箱验证成功！
            </h2>

            {/* 用户信息 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium mb-2">
                欢迎加入 ThinkSo！
              </p>
              <div className="text-sm text-green-700 space-y-1">
                <p>邮箱：{userInfo.email}</p>
                <p>显示名称：{userInfo.display_name || 'ThinkSo用户'}</p>
                <p>注册时间：{new Date(userInfo.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>

            {/* 功能介绍 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-3">现在您可以：</h3>
              <div className="grid grid-cols-1 gap-2 text-sm text-blue-700">
                <div className="flex items-center justify-center">
                  <span className="mr-2">📄</span>
                  <span>上传文档并生成AI思维导图</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="mr-2">💾</span>
                  <span>保存和管理您的思维导图</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="mr-2">🔗</span>
                  <span>分享思维导图给朋友</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="mr-2">📥</span>
                  <span>导出为 SVG/PNG 格式</span>
                </div>
              </div>
            </div>

            {/* 自动跳转提示 */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                3秒后将自动跳转到登录页面
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Link
                href="/?auth=login&verified=true"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-200 inline-block"
              >
                立即登录
              </Link>
              
              <Link
                href="/"
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition duration-200 inline-block"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 验证失败
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* 错误图标 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <div className="text-red-500 text-2xl">❌</div>
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            邮箱验证失败
          </h2>

          {/* 错误信息 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              {error}
            </p>
          </div>

          {/* 可能的原因 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 mb-2">可能的原因：</h3>
            <ul className="text-xs text-yellow-700 text-left space-y-1">
              <li>• 验证链接已过期（24小时有效期）</li>
              <li>• 验证链接已被使用过</li>
              <li>• 验证链接格式不正确</li>
              <li>• 网络连接问题</li>
            </ul>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <Link
              href="/register"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-200 inline-block"
            >
              重新注册
            </Link>
            
            <div className="flex space-x-3">
              <Link
                href="/?auth=login"
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition duration-200 text-center"
              >
                前往登录
              </Link>
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition duration-200 text-center"
              >
                返回首页
              </Link>
            </div>
          </div>

          {/* 客服提示 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              如果问题持续存在，请联系客服获取帮助
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}