/**
 * 邮箱验证发送成功页面 - ThinkSo v3.2.0
 */
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailSentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isClient, setIsClient] = useState(false)

  // 初始化客户端状态
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* 图标 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <div className="text-green-500 text-2xl">📧</div>
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            验证邮件已发送
          </h2>

          {/* 描述 */}
          <div className="text-gray-600 space-y-3 mb-8">
            <p>
              我们已向 <span className="font-semibold text-gray-900">{email}</span> 发送了验证邮件
            </p>
            <p>
              邮件标题：<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                ThinkTree注册验证码：XXXXXX
              </span>
            </p>
            <p className="text-sm">
              请检查您的邮箱并点击验证链接完成账户激活
            </p>
          </div>

          {/* 注意事项 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-yellow-500 text-lg mr-3 mt-0.5">⚠️</div>
              <div className="text-left text-sm text-yellow-800">
                <p className="font-medium mb-2">注意事项：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 验证链接有效期为 24 小时</li>
                  <li>• 请检查垃圾邮件文件夹</li>
                  <li>• 验证成功后即可正常使用所有功能</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 功能预览 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-3">验证后您将能够：</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div className="flex items-center">
                <span className="mr-2">📄</span>
                <span>上传文档生成思维导图</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">💾</span>
                <span>保存管理思维导图</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔗</span>
                <span>分享思维导图</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📥</span>
                <span>导出SVG/PNG格式</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload()
                }
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-200"
            >
              重新发送验证邮件
            </button>
            
            <div className="flex space-x-3">
              <Link
                href="/login"
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
              未收到邮件？请检查垃圾邮件文件夹或联系客服获取帮助
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    }>
      <VerifyEmailSentContent />
    </Suspense>
  )
}