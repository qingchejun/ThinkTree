/**
 * 个人控制台页面 - ThinkTree v2.3.0
 * 用户思维导图管理中心
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { ToastManager } from '../../components/common/Toast'
import ShareModal from '../../components/share/ShareModal'

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  
  // 页面状态管理
  const [mindmaps, setMindmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 分享模态框状态
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    mindmapId: null,
    mindmapTitle: ''
  })

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, isLoading, router])

  // 获取用户思维导图列表
  useEffect(() => {
    const fetchMindmaps = async () => {
      if (!token || !user) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setMindmaps(data || [])
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || '获取思维导图列表失败')
        }
      } catch (err) {
        console.error('获取思维导图列表失败:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMindmaps()
  }, [token, user])

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 删除思维导图
  const handleDelete = async (mindmapId, title) => {
    if (!window.confirm(`确定要删除思维导图"${title}"吗？此操作不可恢复。`)) {
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
        // 从列表中移除已删除的思维导图
        setMindmaps(prev => prev.filter(mindmap => mindmap.id !== mindmapId))
        ToastManager.success(`思维导图"${title}"已成功删除`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '删除失败')
      }
    } catch (err) {
      console.error('删除思维导图失败:', err)
      ToastManager.error(err.message)
    }
  }

  // 打开分享模态框
  const handleShareClick = (mindmapId, title) => {
    setShareModal({
      isOpen: true,
      mindmapId,
      mindmapTitle: title
    })
  }

  // 关闭分享模态框
  const handleCloseShareModal = () => {
    setShareModal({
      isOpen: false,
      mindmapId: null,
      mindmapTitle: ''
    })
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录状态
  if (!user) {
    return null // 会被路由保护重定向
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📊 我的思维导图
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                管理您保存的所有思维导图
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">👋 {user.email}</span>
              <a
                href="/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                ➕ 创建新思维导图
              </a>
              <a
                href="/"
                className="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                ← 返回首页
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载您的思维导图...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">加载失败</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 思维导图列表 */}
        {!loading && !error && (
          <>
            {mindmaps.length === 0 ? (
              // 空状态
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🌳</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">还没有思维导图</h3>
                <p className="text-gray-500 mb-6">
                  创建您的第一个 AI 思维导图，开始整理和可视化您的想法
                </p>
                <a
                  href="/create"
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  🚀 创建第一个思维导图
                </a>
              </div>
            ) : (
              // 思维导图网格列表
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mindmaps.map((mindmap) => (
                  <div
                    key={mindmap.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* 卡片头部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {mindmap.title}
                        </h3>
                        {mindmap.description && (
                          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                            {mindmap.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 标签 */}
                    {mindmap.tags && mindmap.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {mindmap.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {mindmap.tags.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{mindmap.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 内容预览 */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">内容预览:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded text-left">
                        {mindmap.content_preview}
                      </p>
                    </div>

                    {/* 卡片底部 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        <p>更新于</p>
                        <p className="font-medium">{formatDate(mindmap.updated_at)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/mindmap/${mindmap.id}`)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          👁️ 查看
                        </button>
                        <button
                          onClick={() => handleShareClick(mindmap.id, mindmap.title)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          🔗 分享
                        </button>
                        <button
                          onClick={() => handleDelete(mindmap.id, mindmap.title)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 分享模态框 */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={handleCloseShareModal}
        mindmapId={shareModal.mindmapId}
        mindmapTitle={shareModal.mindmapTitle}
      />
    </div>
  )
}