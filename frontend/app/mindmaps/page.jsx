/**
 * 思维导图管理页面 - 结合卡片效果与侧边栏搜索功能
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import ShareModal from '../../components/share/ShareModal'
import MindmapThumbnail from '../../components/mindmap/MindmapThumbnail'
import Sidebar from '../../components/common/Sidebar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import Pagination from '../../components/ui/Pagination'
import { 
  Eye, 
  Trash2, 
  Share2, 
  Download, 
  PlusCircle, 
  FileX, 
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

export default function MindmapsPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  
  // 页面状态管理
  const [mindmaps, setMindmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isClient, setIsClient] = useState(false)

  // 搜索、排序和分页状态
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7 // 新建卡片占一个位置，所以每页显示7个导图 + 1个新建 = 8个项目
  
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

  // 检查是否在客户端
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
      return
    }
  }, [user, isLoading, router])

  // 获取用户思维导图列表
  useEffect(() => {
    const fetchMindmaps = async () => {
      if (!token || !user) {
        setMindmaps([])
        setLoading(false)
        return
      }

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

  // 处理查看点击
  const handleView = (e, id) => {
    e.stopPropagation()
    router.push(`/mindmap/${id}`)
  }

  // 处理PNG导出 - 优化版本
  const handleExport = async (e, mindmap) => {
    e.stopPropagation()
    
    try {
      console.log(`开始导出思维导图 (PNG):`, mindmap.title)
      
      // 使用try-catch包装动态导入，避免chunk加载问题
      let Markmap, Transformer, exportPNG, getSafeFilename, getTimestamp
      
      try {
        // 分别导入，更容易定位问题
        const markmapViewModule = await import('markmap-view')
        Markmap = markmapViewModule.Markmap
        
        const markmapLibModule = await import('markmap-lib')
        Transformer = markmapLibModule.Transformer
        
        const exportUtilsModule = await import('../../lib/exportUtils.js')
        exportPNG = exportUtilsModule.exportPNG
        getSafeFilename = exportUtilsModule.getSafeFilename
        getTimestamp = exportUtilsModule.getTimestamp
      } catch (importError) {
        console.error('导入模块失败:', importError)
        // 回退到markdown导出
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
      
      // 创建临时SVG容器
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
        // 转换markdown内容
        const transformer = new Transformer()
        const { root } = transformer.transform(mindmap.content)
        
        // 创建markmap实例
        const markmapInstance = Markmap.create(tempSvg, {
          duration: 0,
          maxWidth: 400,
          spacingVertical: 8,
          spacingHorizontal: 120,
          autoFit: true,
          pan: false,
          zoom: false,
        })
        
        // 渲染思维导图
        markmapInstance.setData(root)
        markmapInstance.fit()
        
        // 等待渲染完成
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 生成文件名
        const safeTitle = getSafeFilename(mindmap.title)
        const timestamp = getTimestamp()
        const filename = `${safeTitle}_${timestamp}`
        
        // 导出PNG
        const result = await exportPNG(markmapInstance, filename, 4)
        
        if (result.success) {
          console.log(`PNG文件导出成功: ${result.filename}`)
        } else {
          throw new Error(result.error)
        }
        
      } finally {
        // 清理临时元素
        document.body.removeChild(tempContainer)
      }
      
    } catch (error) {
      console.error('导出思维导图失败:', error)
      alert(`导出失败: ${error.message}`)
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

  // 处理删除点击
  const handleDelete = (e, mindmap) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      mindmapId: mindmap.id,
      mindmapTitle: mindmap.title,
      isDeleting: false
    })
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteModal.mindmapId) return

    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }))
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${deleteModal.mindmapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // 从列表中移除已删除的思维导图
        setMindmaps(prev => prev.filter(mindmap => mindmap.id !== deleteModal.mindmapId))
        setSuccessMessage(`思维导图"${deleteModal.mindmapTitle}"已成功删除`)
        // 3秒后清除成功消息
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '删除失败')
      }
    } catch (error) {
      console.error('删除思维导图失败:', error)
      setError(error.message)
      // 5秒后清除错误消息
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeleteModal({
        isOpen: false,
        mindmapId: null,
        mindmapTitle: '',
        isDeleting: false
      })
    }
  }

  // 取消删除
  const cancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      mindmapId: null,
      mindmapTitle: '',
      isDeleting: false
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

  // 创建新思维导图
  const handleCreateNew = () => {
    router.push('/create')
  }

  // 搜索和排序逻辑
  const filteredAndSortedMindmaps = mindmaps
    .filter(mindmap => mindmap.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.updated_at)
      const dateB = new Date(b.updated_at)
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  // 分页逻辑
  const paginatedMindmaps = filteredAndSortedMindmaps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredAndSortedMindmaps.length / itemsPerPage)

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">我的思维导图</h1>
          
          {/* 错误和成功消息提示 */}
          <div className="mb-6 space-y-3">
            {error && (
              <div className="flex items-center p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* 搜索和筛选控件 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="搜索思维导图..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select onValueChange={setSortOrder} defaultValue={sortOrder}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center">
                  {sortOrder === 'desc' ? (
                    <SortDesc className="w-4 h-4 mr-2" />
                  ) : (
                    <SortAsc className="w-4 h-4 mr-2" />
                  )}
                  <SelectValue placeholder="排序方式" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center">
                    <SortDesc className="w-4 h-4 mr-2" />
                    最新优先
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center">
                    <SortAsc className="w-4 h-4 mr-2" />
                    最早优先
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* 新建导图卡片骨架屏 */}
              <div className="cursor-pointer group bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 h-full min-h-[200px] animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
              {/* 加载骨架屏 */}
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl border overflow-hidden min-h-[200px] animate-pulse">
                  <div className="bg-gray-200 h-32"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedMindmaps.length > 0 ? (
            <>
              {/* 思维导图卡片网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* 创建新项目卡片 */}
                <div onClick={handleCreateNew} 
                     className="cursor-pointer group bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300 flex flex-col items-center justify-center p-6 h-full min-h-[200px] hover:scale-105">
                  <PlusCircle className="w-12 h-12 text-green-500 group-hover:text-blue-500 transition-all duration-300"/>
                  <h3 className="font-semibold text-gray-600 group-hover:text-blue-600 transition-colors text-lg mt-2">新建导图</h3>
                </div>

                {/* 项目卡片 */}
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
                          content={mindmap.content} 
                          title={mindmap.title}
                          className="w-full h-full"
                        />
                        {/* 悬停遮罩效果 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-4">
                        <h3 className="card-title font-semibold text-gray-800 truncate transition-colors duration-200" title={mindmap.title}>
                          {mindmap.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(mindmap.updated_at)} 更新
                        </p>
                      </div>
                    </div>
                    <div className="card-actions border-t border-gray-100 p-3 flex justify-end space-x-2 bg-gray-50/50 transition-all duration-300">
                      <button 
                        onClick={(e) => handleView(e, mindmap.id)} 
                        className="action-button text-green-500 hover:bg-green-100 hover:text-green-600"
                        title="查看思维导图"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={(e) => handleExport(e, mindmap)} 
                         className="action-button text-purple-500 hover:bg-purple-100 hover:text-purple-600"
                         title="导出为PNG图片"
                       >
                         <Download className="w-4 h-4" />
                       </button>
                      <button 
                        onClick={(e) => handleShare(e, mindmap)} 
                        className="action-button text-blue-500 hover:bg-blue-100 hover:text-blue-600"
                        title="分享思维导图"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, mindmap)} 
                        className="action-button text-red-500 hover:bg-red-100 hover:text-red-600"
                        title="删除思维导图"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                  />
                </div>
              )}
            </>
          ) : (
            /* 空状态 */
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
              <FileX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                {searchTerm ? '没有找到匹配的思维导图' : '还没有任何思维导图'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? '尝试使用不同的搜索词' : '点击下面的按钮，开始你的第一次创作吧！'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button 
                    onClick={handleCreateNew} 
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    新建导图
                  </button>
                </div>
              )}
            </div>
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

      {/* 删除确认弹窗 */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                <p className="text-sm text-gray-500">此操作无法撤销</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              确定要删除思维导图 <span className="font-semibold">"{deleteModal.mindmapTitle}"</span> 吗？
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {deleteModal.isDeleting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}