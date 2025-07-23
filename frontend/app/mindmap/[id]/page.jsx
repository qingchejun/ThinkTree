/**
 * 思维导图查看页面 - ThinkTree v2.3.0
 * 显示用户保存的思维导图
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import SimpleMarkmapBasic from '../../../components/mindmap/SimpleMarkmapBasic'
import { ToastManager } from '../../../components/common/Toast'

export default function ViewMindmapPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const mindmapId = params.id
  
  // 页面状态管理
  const [mindmap, setMindmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, isLoading, router])

  // 获取思维导图详情
  useEffect(() => {
    const fetchMindmap = async () => {
      if (!token || !user || !mindmapId) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setMindmap(data)
        } else if (response.status === 404) {
          setError('思维导图不存在或您无权访问')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || '获取思维导图失败')
        }
      } catch (err) {
        console.error('获取思维导图失败:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMindmap()
  }, [token, user, mindmapId])

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 删除思维导图
  const handleDelete = async () => {
    if (!window.confirm(`确定要删除思维导图"${mindmap.title}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        ToastManager.success(`思维导图"${mindmap.title}"已成功删除`)
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '删除失败')
      }
    } catch (err) {
      console.error('删除思维导图失败:', err)
      ToastManager.error(`删除失败: ${err.message}`)
    }
  }

  // 加载状态
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">加载思维导图中...</p>
        </div>
      </div>
    )
  }

  // 未登录状态
  if (!user) {
    return null // 会被路由保护重定向
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-900 mb-4">加载失败</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700"
              >
                ← 返回控制台
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700"
              >
                🔄 重新加载
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 思维导图不存在
  if (!mindmap) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">思维导图不存在</h2>
            <p className="text-gray-600 mb-6">您要查看的思维导图可能已被删除或您没有访问权限</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700"
            >
              ← 返回控制台
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  ← 返回控制台
                </button>
                <div className="border-l border-gray-300 h-6"></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {mindmap.title}
                  </h1>
                  <p className="text-sm text-gray-600">
                    创建于 {formatDate(mindmap.created_at)}
                    {mindmap.updated_at !== mindmap.created_at && (
                      <span> · 更新于 {formatDate(mindmap.updated_at)}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">👋 {user.email}</span>
              <button
                onClick={() => alert('编辑功能开发中...')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                ✏️ 编辑
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                🗑️ 删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 思维导图信息 */}
      {(mindmap.description || (mindmap.tags && mindmap.tags.length > 0)) && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {mindmap.description && (
              <p className="text-blue-900 mb-3">{mindmap.description}</p>
            )}
            {mindmap.tags && mindmap.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-blue-800 text-sm font-medium">标签:</span>
                {mindmap.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-200 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 思维导图展示区 */}
      <div className="flex-1">
        <div className="h-[calc(100vh-140px)]">
          <div className="h-full bg-white border border-gray-200 mx-4 my-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">思维导图视图</h2>
              <div className="text-sm text-gray-500">
                Markmap 可视化
              </div>
            </div>
            <div className="h-[calc(100%-65px)]">
              <SimpleMarkmapBasic 
                mindmapData={{
                  title: mindmap.title,
                  markdown: mindmap.content
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}