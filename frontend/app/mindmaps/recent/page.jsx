/**
 * 最近打开的思维导图页面
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../hooks/useToast'
import ShareModal from '../../../components/share/ShareModal'
import MindmapThumbnail from '../../../components/mindmap/MindmapThumbnail'
import Sidebar from '../../../components/common/Sidebar'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { iconSizes } from '../../../design-system/tokens/semantic'
import { Input } from '../../../components/ui/Input'
import Pagination from '../../../components/ui/Pagination'
import { 
  Eye, 
  Share2, 
  Download, 
  Search,
  CheckCircle,
  Loader2,
  Clock,
  Star,
  StarOff
} from 'lucide-react'

export default function RecentPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()
  
  // 页面状态管理
  const [mindmaps, setMindmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // 搜索和分页状态
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8 // 最近打开页面不需要新建卡片，所以显示8个
  
  // 分享模态框状态
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    mindmapId: null,
    mindmapTitle: ''
  })

  // 删除确认弹窗状态
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    mindmapId: null,
    mindmapTitle: '',
    isDeleting: false
  })

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
      return
    }
  }, [user, isLoading, router])

  // 获取最近打开的思维导图列表
  useEffect(() => {
    const fetchRecent = async () => {
      if (!user) {
        setMindmaps([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // 获取所有思维导图
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          // 获取思维导图列表 - 后端返回的是 {items: [...], has_next: boolean, next_cursor: string}
          const mindmaps = data.items || []
          
          // 获取最近访问记录
          const recentIds = JSON.parse(localStorage.getItem('recentMindmaps') || '[]')
          
          // 根据最近访问顺序排序并过滤
          const recentMindmaps = recentIds
            .map(recentItem => {
              const mindmap = mindmaps.find(m => m.id === recentItem.id)
              return mindmap ? { ...mindmap, lastVisited: recentItem.lastVisited } : null
            })
            .filter(Boolean)
            .slice(0, 20) // 最多显示20个最近打开的项目
          
          setMindmaps(recentMindmaps || [])
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || '获取最近打开列表失败')
        }
      } catch (err) {
        console.error('获取最近打开列表失败:', err)
        setError(null)
        toast.error(`获取最近打开列表失败：${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchRecent()
  }, [user])

  // 监听localStorage变化，实时更新最近访问列表
  useEffect(() => {
    const handleStorageChange = () => {
      // 重新获取最近访问列表
      if (user) {
        const fetchRecent = async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            })

            if (response.ok) {
              const data = await response.json()
              // 获取思维导图列表 - 后端返回的是 {items: [...], has_next: boolean, next_cursor: string}
              const mindmaps = data.items || []
              const recentIds = JSON.parse(localStorage.getItem('recentMindmaps') || '[]')
              const recentMindmaps = recentIds
                .map(recentItem => {
                  const mindmap = mindmaps.find(m => m.id === recentItem.id)
                  return mindmap ? { ...mindmap, lastVisited: recentItem.lastVisited } : null
                })
                .filter(Boolean)
                .slice(0, 20)
              setMindmaps(recentMindmaps || [])
            }
          } catch (err) {
            console.error('更新最近访问列表失败:', err)
            toast.error('更新最近访问列表失败')
          }
        }
        fetchRecent()
      }
    }

    // 监听storage事件
    window.addEventListener('storage', handleStorageChange)
    // 自定义事件，用于同一页面的操作
    window.addEventListener('recentChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('recentChanged', handleStorageChange)
    }
  }, [user])

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

  // 格式化最近访问时间
  const formatLastVisited = (timestamp) => {
    const now = new Date()
    const visitTime = new Date(timestamp)
    const diffMs = now - visitTime
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) {
      return '刚刚'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return formatDate(timestamp)
    }
  }

  // 记录访问
  const recordVisit = (mindmapId) => {
    const recentIds = JSON.parse(localStorage.getItem('recentMindmaps') || '[]')
    const existingIndex = recentIds.findIndex(item => item.id === mindmapId)
    
    const visitRecord = {
      id: mindmapId,
      lastVisited: new Date().toISOString()
    }
    
    if (existingIndex !== -1) {
      // 更新现有记录
      recentIds[existingIndex] = visitRecord
    } else {
      // 添加新记录到开头
      recentIds.unshift(visitRecord)
    }
    
    // 保持最多20条记录
    const limitedRecords = recentIds.slice(0, 20)
    localStorage.setItem('recentMindmaps', JSON.stringify(limitedRecords))
  }

  // 处理查看点击
  const handleView = (e, id) => {
    e.stopPropagation()
    recordVisit(id)
    router.push(`/mindmap/${id}`)
  }

  // 处理PNG导出
  const handleExport = async (e, mindmap) => {
    e.stopPropagation()
    
    try {
      console.log(`开始导出思维导图 (PNG):`, mindmap.title)
      
      let Markmap, Transformer, exportPNG, getSafeFilename, getTimestamp
      
      try {
        const markmapViewModule = await import('markmap-view')
        Markmap = markmapViewModule.Markmap
        
        const markmapLibModule = await import('markmap-lib')
        Transformer = markmapLibModule.Transformer
        
        const exportUtilsModule = await import('../../../lib/exportUtils.js')
        exportPNG = exportUtilsModule.exportPNG
        getSafeFilename = exportUtilsModule.getSafeFilename
        getTimestamp = exportUtilsModule.getTimestamp
      } catch (importError) {
        console.error('导入模块失败:', importError)
        const blob = new Blob([mindmap.content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${mindmap.title}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        console.log('已回退到Markdown导出')
        return
      }
      
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '1600px'
      tempContainer.style.height = '1200px'
      document.body.appendChild(tempContainer)
      
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      tempSvg.setAttribute('width', '1600')
      tempSvg.setAttribute('height', '1200')
      tempContainer.appendChild(tempSvg)
      
      try {
        const transformer = new Transformer()
        const { root } = transformer.transform(mindmap.content)
        
        const markmapInstance = Markmap.create(tempSvg, {
          duration: 0,
          maxWidth: 400,
          spacingVertical: 8,
          spacingHorizontal: 120,
          autoFit: true,
          pan: false,
          zoom: false,
        })
        
        markmapInstance.setData(root)
        markmapInstance.fit()
        
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const safeTitle = getSafeFilename(mindmap.title)
        const timestamp = getTimestamp()
        const filename = `${safeTitle}_${timestamp}`
        
        const result = await exportPNG(markmapInstance, filename, 4)
        
        if (result.success) {
          console.log(`PNG文件导出成功: ${result.filename}`)
        } else {
          throw new Error(result.error)
        }
        
      } finally {
        document.body.removeChild(tempContainer)
      }
      
    } catch (error) {
      console.error('导出思维导图失败:', error)
      toast.error(`导出失败：${error.message}`)
    }
  }

  // 处理分享点击
  const handleShare = (e, mindmap) => {
    e.stopPropagation()
    setShareModal({
      isOpen: true,
      mindmapId: mindmap.id,
      mindmapTitle: mindmap.title
    })
  }

  // 处理收藏/取消收藏
  const handleToggleFavorite = (e, mindmap) => {
    e.stopPropagation()
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
    const isFavorite = favoriteIds.includes(mindmap.id)
    
    if (isFavorite) {
      const newFavoriteIds = favoriteIds.filter(id => id !== mindmap.id)
      localStorage.setItem('favoriteMindmaps', JSON.stringify(newFavoriteIds))
      setSuccessMessage(`已取消收藏"${mindmap.title}"`)
    } else {
      favoriteIds.push(mindmap.id)
      localStorage.setItem('favoriteMindmaps', JSON.stringify(favoriteIds))
      setSuccessMessage(`已收藏"${mindmap.title}"`)
    }
    
    // 通知其他页面收藏状态已变化
    window.dispatchEvent(new CustomEvent('favoritesChanged'))
    
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // 检查是否收藏
  const isFavorite = (mindmapId) => {
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
    return favoriteIds.includes(mindmapId)
  }

  // 关闭分享模态框
  const handleCloseShareModal = () => {
    setShareModal({
      isOpen: false,
      mindmapId: null,
      mindmapTitle: ''
    })
  }

  // 搜索逻辑
  const filteredMindmaps = mindmaps
    .filter(mindmap => mindmap.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // 按最近访问时间排序
      const timeA = new Date(a.lastVisited)
      const timeB = new Date(b.lastVisited)
      return timeB - timeA
    })

  // 分页逻辑
  const paginatedMindmaps = filteredMindmaps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredMindmaps.length / itemsPerPage)

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex h-screen bg-brand-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-core-600 mx-auto mb-4" />
            <p className="text-brand-600">加载中...</p>
          </div>
        </main>
      </div>
    )
  }

  // 未登录状态
  if (!user) {
    return null // 会被路由保护重定向
  }

  return (
    <div className="flex h-screen bg-brand-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* 成功消息就地微反馈 */}
          <div className="mb-6 space-y-3">
            {successMessage && (
              <div className="flex items-center p-4 bg-success-50 text-success-800 border border-success-200 rounded-lg">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* 搜索控件 */}
          <Card className="p-4 mb-8">
            <div className="relative max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-400 ${iconSizes.sm}`} />
              <Input
                type="text"
                placeholder="搜索最近打开的思维导图..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </Card>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl border overflow-hidden min-h-[200px] animate-pulse">
                  <div className="bg-brand-200 h-32"></div>
                  <div className="p-4">
                    <div className="h-4 bg-brand-200 rounded mb-2"></div>
                    <div className="h-3 bg-brand-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMindmaps.length > 0 ? (
            <>
              {/* 最近打开思维导图卡片网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedMindmaps.map((mindmap, index) => (
                  <div 
                    key={mindmap.id} 
                    className="project-card group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div onClick={() => router.push(`/mindmap/${mindmap.id}`)} className="flex-grow cursor-pointer">
                      {/* 动态预览图 */}
                      <div className="card-preview h-32 overflow-hidden relative transition-transform duration-300">
                        <MindmapThumbnail 
                          content={mindmap.content_preview || mindmap.content} 
                          title={mindmap.title}
                          className="w-full h-full"
                        />
                        {/* 最近访问标识 */}
                        <div className="absolute top-2 right-2">
                          <Clock className="w-5 h-5 text-core-600" />
                        </div>
                        {/* 悬停遮罩效果 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-4">
                        <h3 className="card-title font-semibold text-brand-800 truncate transition-colors duration-200" title={mindmap.title}>
                          {mindmap.title}
                        </h3>
                        <p className="text-sm text-brand-500 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatLastVisited(mindmap.lastVisited)}
                        </p>
                      </div>
                    </div>
                    <div className="card-actions border-t border-brand-100 p-3 flex justify-end space-x-2 bg-brand-50/50 transition-all duration-300">
                      <Button onClick={(e) => handleView(e, mindmap.id)} variant="ghost" size="sm" className="p-2 text-core-600 hover:bg-core-100 hover:text-core-700" title="查看思维导图">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button onClick={(e) => handleExport(e, mindmap)} variant="ghost" size="sm" className="p-2 text-content-600 hover:bg-content-100 hover:text-content-700" title="导出为PNG图片">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button onClick={(e) => handleShare(e, mindmap)} variant="ghost" size="sm" className="p-2 text-collaboration-600 hover:bg-collaboration-100 hover:text-collaboration-700" title="分享思维导图">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button onClick={(e) => handleToggleFavorite(e, mindmap)} variant="ghost" size="sm" className={`p-2 ${isFavorite(mindmap.id) ? 'text-accent-600 hover:bg-accent-100 hover:text-accent-700' : 'text-brand-400 hover:bg-brand-100 hover:text-accent-600'}`} title={isFavorite(mindmap.id) ? '取消收藏' : '收藏'}>
                        {isFavorite(mindmap.id) ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <Card className="p-4 mt-8">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                  />
                </Card>
              )}
            </>
          ) : (
            /* 空状态 */
            <Card variant="feature" className="text-center py-16 rounded-2xl border-2 border-dashed border-brand-200">
              <div className="mb-2"><Badge variant="feature" size="sm">提示</Badge></div>
              <Clock className="mx-auto h-12 w-12 text-brand-400 mb-4" />
              <h3 className="mt-4 text-lg font-semibold text-brand-800">
                {searchTerm ? '没有找到匹配的记录' : '还没有打开过任何思维导图'}
              </h3>
              <p className="mt-2 text-sm text-brand-500">
                {searchTerm ? '尝试使用不同的搜索词' : '访问思维导图后会自动记录在这里'}
              </p>
            </Card>
          )}
        </div>
      </main>

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