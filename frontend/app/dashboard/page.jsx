/**
 * 控制台页面 - ThinkTree v2.1.0
 * 测试全局认证状态和用户信息显示
 */
'use client'

import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import AuthStatus from '../../components/common/AuthStatus'

export default function DashboardPage() {
  const { user, token, isLoading, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果未认证，显示空页面（即将重定向）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">正在跳转到登录页面...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 调试组件 */}
      <AuthStatus />
      
      {/* 顶部导航栏 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">ThinkTree 控制台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 用户信息卡片 */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">用户信息</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">邮箱</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">用户ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">注册时间</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '未知'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">认证状态</dt>
                  <dd className="mt-1">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      已认证
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 功能区域 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">快速操作</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                  href="/test"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-center font-medium"
                >
                  创建思维导图
                </Link>
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-center font-medium cursor-not-allowed"
                >
                  我的作品 (开发中)
                </button>
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-center font-medium cursor-not-allowed"
                >
                  设置 (开发中)
                </button>
              </div>
            </div>
          </div>

          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 bg-gray-100 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">调试信息</h2>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Token 存在:</strong> {token ? '是' : '否'}</p>
                  <p><strong>Token 长度:</strong> {token ? token.length : '0'}</p>
                  <p><strong>认证状态:</strong> {isAuthenticated ? '已认证' : '未认证'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}