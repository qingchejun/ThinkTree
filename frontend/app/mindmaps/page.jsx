/**
 * 思维导图管理页面 - ThinkTree v3.2.2
 * 专门用于管理所有思维导图的页面
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
// 移除ToastManager，使用内联提示样式
import ShareModal from '../../components/share/ShareModal'
import Header from '../../components/common/Header'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'

export default function MindmapsPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  
  // 页面状态管理
  const [mindmaps, setMindmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null) // 成功消息状态
  const [isClient, setIsClient] = useState(false) // 客户端检查

  // 检查是否在客户端
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 分享模态框状态
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    mindmapId: null,
    mindmapTitle: ''
  })

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
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
    if (!isClient || !window.confirm(`确定要删除思维导图"${title}"吗？此操作不可恢复。`)) {
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
        setSuccessMessage(`思维导图"${title}"已成功删除`)
        // 3秒后清除成功消息
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '删除失败')
      }
    } catch (err) {
      console.error('删除思维导图失败:', err)
      setError(err.message)
      // 5秒后清除错误消息
      setTimeout(() => setError(null), 5000)
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

  // 截断文本显示
  const truncateText = (text, maxLength = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-text-secondary">加载中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 未登录状态
  if (!user) {
    return null // 会被路由保护重定向
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* 头部导航 */}
      <Header 
        title="📊 我的思维导图"
        subtitle="管理您保存的所有思维导图"
        showCreateButton={true}
      />

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">我的工作空间</h2>
            <p className="text-text-secondary mt-1">
              {mindmaps.length > 0 ? `共 ${mindmaps.length} 个思维导图` : '开始创建您的第一个思维导图'}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/create')}
            className="flex items-center gap-2"
          >
            ➕ 创建思维导图
          </Button>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center py-12">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-text-secondary">正在加载您的思维导图...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 成功消息 */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-500 mr-3">✅</div>
              <div>
                <h4 className="text-sm font-medium text-green-900">操作成功</h4>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">❌</div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">操作失败</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button
                  variant="secondary"
                  onClick={() => setError(null)}
                >
                  关闭
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 思维导图列表 */}
        {!loading && !error && (
          <>
            {mindmaps.length === 0 ? (
              // 空状态 - 友好提示
              <div className="flex justify-center">
                <Card className="w-full max-w-2xl">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-6">🌳</div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">
                        还没有思维导图
                      </h3>
                      <p className="text-text-secondary mb-8 max-w-md mx-auto">
                        创建您的第一个 AI 思维导图，开始整理和可视化您的想法。
                        支持文档上传，智能解析，一键生成专业思维导图。
                      </p>
                      <Button 
                        size="lg"
                        onClick={() => router.push('/create')}
                        className="flex items-center gap-2 mx-auto"
                      >
                        🚀 立即创建第一个
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // 思维导图网格列表 - 现代化卡片设计
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mindmaps.map((mindmap) => (
                  <Card 
                    key={mindmap.id}
                    className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                  >
                    {/* 卡片头部 */}
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">
                        {mindmap.title}
                      </CardTitle>
                      <div className="text-xs text-text-tertiary mt-1">
                        更新于 {formatDate(mindmap.updated_at)}
                      </div>
                    </CardHeader>

                    {/* 卡片内容 */}
                    <CardContent>
                      {/* 描述或内容预览 */}
                      {mindmap.description ? (
                        <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                          {truncateText(mindmap.description, 120)}
                        </p>
                      ) : (
                        <p className="text-sm text-text-secondary mb-4 line-clamp-3 bg-background-secondary p-2 rounded">
                          {truncateText(mindmap.content_preview, 120)}
                        </p>
                      )}

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
                            <span className="inline-block bg-border-secondary text-text-tertiary text-xs px-2 py-1 rounded">
                              +{mindmap.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>

                    {/* 卡片底部操作区 */}
                    <CardFooter className="flex items-center justify-between gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/mindmap/${mindmap.id}`)}
                        className="flex items-center gap-1"
                      >
                        👁️ 查看
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleShareClick(mindmap.id, mindmap.title)}
                          className="flex items-center gap-1"
                        >
                          🔗 分享
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(mindmap.id, mindmap.title)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          🗑️ 删除
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
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