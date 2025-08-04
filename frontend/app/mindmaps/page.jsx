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

import Sidebar from '../../components/common/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';

export default function MindmapsPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  
  // 页面状态管理
  const [mindmaps, setMindmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null) // 成功消息状态
  const [isClient, setIsClient] = useState(false) // 客户端检查

  // 搜索、排序和分页状态
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // “新建”卡片占一个位置，所以每页显示7个导图 + 1个新建 = 8个项目

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


      // 生产环境真实请求
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

  // 搜索和排序逻辑
  const filteredAndSortedMindmaps = mindmaps
    .filter(mindmap => mindmap.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.updated_at);
      const dateB = new Date(b.updated_at);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  // 分页逻辑
  const paginatedMindmaps = filteredAndSortedMindmaps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedMindmaps.length / itemsPerPage);

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* 错误和成功消息提示 */}
          <div className="my-6 space-y-3">
            {error && <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">{error}</div>}
            {successMessage && <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">{successMessage}</div>}
          </div>

          {/* 搜索和筛选控件 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-grow max-w-xs">
              <Input
                type="text"
                placeholder="搜索思维导图..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select onValueChange={setSortOrder} defaultValue={sortOrder}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">最新优先</SelectItem>
                <SelectItem value="asc">最早优先</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 思维导图列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {/* 固定新建导图入口 */}
            <Card 
              className="flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 cursor-pointer min-h-[220px]"
              onClick={() => router.push('/create')}
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">新建导图</h3>
            </Card>

            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse min-h-[220px]">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              paginatedMindmaps.map((mindmap) => (
                <Card key={mindmap.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 min-h-[220px]">
                    <div className="flex-grow p-6">
                      <CardTitle className="text-lg font-bold text-gray-800 truncate">{mindmap.title}</CardTitle>
                      <p className="text-sm text-gray-500 h-16 overflow-hidden mt-2">
                        {truncateText(mindmap.description, 70) || '暂无描述'}
                      </p>
                    </div>
                    <CardFooter className="flex justify-between items-center bg-gray-50 p-3 border-t">
                      <span className="text-xs text-gray-500">{formatDate(mindmap.updated_at)}</span>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-black text-white hover:bg-gray-800 text-xs px-1.5 h-5"
                          onClick={() => router.push(`/editor/${mindmap.id}`)}
                        >
                          查看
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-black text-white hover:bg-gray-800 text-xs px-1.5 h-5"
                          onClick={() => handleDelete(mindmap.id, mindmap.title)}
                        >
                          删除
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
              ))
            )}
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          )}

          {/* 空状态 */}
          {!loading && filteredAndSortedMindmaps.length === 0 && (
            <div className="text-center py-16 col-span-full">
              <h3 className="text-xl font-semibold text-gray-800">没有找到思维导图</h3>
              <p className="text-gray-500 mt-2">开始创建您的第一个思维导图吧！</p>
            </div>
          )}
        </div>
      </main>

      {/* 分享模态框 */}
      {shareModal.isOpen && (
        <ShareModal
          mindmapId={shareModal.mindmapId}
          mindmapTitle={shareModal.mindmapTitle}
          onClose={handleCloseShareModal}
        />
      )}
    </div>
  )
}