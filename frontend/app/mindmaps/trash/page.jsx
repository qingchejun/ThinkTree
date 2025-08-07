/**
 * 回收站页面
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import MindmapThumbnail from '../../../components/mindmap/MindmapThumbnail'
import Sidebar from '../../../components/common/Sidebar'
import { Input } from '../../../components/ui/Input'
import Pagination from '../../../components/ui/Pagination'
import { 
  RotateCcw, 
  Trash2, 
  FileX, 
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'

export default function TrashPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // 页面状态管理
  const [trashedMindmaps, setTrashedMindmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // 搜索和分页状态
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  
  // 恢复确认弹窗状态
  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    mindmapId: null,
    mindmapTitle: '',
    isRestoring: false
  })

  // 永久删除确认弹窗状态
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    mindmapId: null,
    mindmapTitle: '',
    isDeleting: false
  })

  // 清空回收站确认弹窗状态
  const [clearAllModal, setClearAllModal] = useState({
    isOpen: false,
    isClearing: false
  })

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
      return
    }
  }, [user, isLoading, router])

  // 获取回收站思维导图列表
  useEffect(() => {
    const fetchTrashedMindmaps = async () => {
      if (!user) {
        setTrashedMindmaps([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // 从localStorage获取回收站数据
        const trashedData = JSON.parse(localStorage.getItem('trashedMindmaps') || '[]')
        console.log('回收站页面: 从localStorage获取的数据:', trashedData)
        
        // 过滤掉超过30天的数据
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const validTrashedData = trashedData.filter(item => {
          const deletedDate = new Date(item.deletedAt)
          return deletedDate > thirtyDaysAgo
        })
        console.log('回收站页面: 过滤后的有效数据:', validTrashedData)
        
        // 更新localStorage，移除过期数据
        if (validTrashedData.length !== trashedData.length) {
          localStorage.setItem('trashedMindmaps', JSON.stringify(validTrashedData))
          console.log('回收站页面: 已清理过期数据')
        }
        
        setTrashedMindmaps(validTrashedData)
      } catch (err) {
        console.error('获取回收站列表失败:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTrashedMindmaps()
  }, [user])

  // 监听localStorage变化，实时更新回收站列表
  useEffect(() => {
    const handleStorageChange = () => {
      // 重新获取回收站列表
      if (user) {
        const fetchTrashedMindmaps = async () => {
          try {
            const trashedData = JSON.parse(localStorage.getItem('trashedMindmaps') || '[]')
            
            // 过滤掉超过30天的数据
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            
            const validTrashedData = trashedData.filter(item => {
              const deletedDate = new Date(item.deletedAt)
              return deletedDate > thirtyDaysAgo
            })
            
            // 更新localStorage，移除过期数据
            if (validTrashedData.length !== trashedData.length) {
              localStorage.setItem('trashedMindmaps', JSON.stringify(validTrashedData))
            }
            
            setTrashedMindmaps(validTrashedData)
          } catch (err) {
            console.error('更新回收站列表失败:', err)
          }
        }
        fetchTrashedMindmaps()
      }
    }

    // 监听storage事件
    window.addEventListener('storage', handleStorageChange)
    // 自定义事件，用于同一页面的操作
    window.addEventListener('trashedChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('trashedChanged', handleStorageChange)
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

  // 计算删除剩余天数
  const getDaysUntilPermanentDelete = (deletedAt) => {
    const deletedDate = new Date(deletedAt)
    const thirtyDaysLater = new Date(deletedDate)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    
    const now = new Date()
    const diffTime = thirtyDaysLater - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  // 处理恢复点击
  const handleRestore = (e, mindmap) => {
    e.stopPropagation()
    setRestoreModal({
      isOpen: true,
      mindmapId: mindmap.id,
      mindmapTitle: mindmap.title,
      isRestoring: false
    })
  }

  // 确认恢复
  const confirmRestore = async () => {
    if (!restoreModal.mindmapId) return

    try {
      setRestoreModal(prev => ({ ...prev, isRestoring: true }))
      
      // 获取要恢复的思维导图数据
      const trashedData = JSON.parse(localStorage.getItem('trashedMindmaps') || '[]')
      const mindmapToRestore = trashedData.find(item => item.id === restoreModal.mindmapId)
      
      if (!mindmapToRestore) {
        throw new Error('找不到要恢复的思维导图')
      }
      
      // 调用API恢复思维导图 - 重新创建思维导图
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: mindmapToRestore.title,
          content: mindmapToRestore.content,
          // 保持原有的创建和更新时间信息（如果需要）
          restored_from_trash: true,
          original_id: mindmapToRestore.id
        })
      })

      if (response.ok) {
        const restoredMindmap = await response.json()
        
        // 从回收站移除
        const updatedTrashedData = trashedData.filter(item => item.id !== restoreModal.mindmapId)
        localStorage.setItem('trashedMindmaps', JSON.stringify(updatedTrashedData))
        
        // 更新当前列表
        setTrashedMindmaps(prev => prev.filter(item => item.id !== restoreModal.mindmapId))
        
        // 通知其他页面数据已变化
        window.dispatchEvent(new CustomEvent('trashedChanged'))
        
        setSuccessMessage(`思维导图"${restoreModal.mindmapTitle}"已成功恢复`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '恢复失败')
      }
      
    } catch (error) {
      console.error('恢复思维导图失败:', error)
      setError(error.message || '恢复失败，请重试')
      setTimeout(() => setError(null), 5000)
    } finally {
      setRestoreModal({
        isOpen: false,
        mindmapId: null,
        mindmapTitle: '',
        isRestoring: false
      })
    }
  }

  // 取消恢复
  const cancelRestore = () => {
    setRestoreModal({
      isOpen: false,
      mindmapId: null,
      mindmapTitle: '',
      isRestoring: false
    })
  }

  // 处理永久删除点击
  const handlePermanentDelete = (e, mindmap) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      mindmapId: mindmap.id,
      mindmapTitle: mindmap.title,
      isDeleting: false
    })
  }

  // 确认永久删除
  const confirmPermanentDelete = async () => {
    if (!deleteModal.mindmapId) return

    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }))
      
      // 永久删除只需要从localStorage移除即可
      // 因为思维导图已经从后端数据库删除了，这里只是清理本地缓存
      const trashedData = JSON.parse(localStorage.getItem('trashedMindmaps') || '[]')
      const updatedTrashedData = trashedData.filter(item => item.id !== deleteModal.mindmapId)
      localStorage.setItem('trashedMindmaps', JSON.stringify(updatedTrashedData))
      
      // 更新当前列表
      setTrashedMindmaps(prev => prev.filter(item => item.id !== deleteModal.mindmapId))
      
      // 通知其他页面数据已变化
      window.dispatchEvent(new CustomEvent('trashedChanged'))
      
      setSuccessMessage(`思维导图"${deleteModal.mindmapTitle}"已永久删除`)
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (error) {
      console.error('永久删除思维导图失败:', error)
      setError('删除失败，请重试')
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

  // 取消永久删除
  const cancelPermanentDelete = () => {
    setDeleteModal({
      isOpen: false,
      mindmapId: null,
      mindmapTitle: '',
      isDeleting: false
    })
  }

  // 处理清空回收站
  const handleClearAll = () => {
    setClearAllModal({
      isOpen: true,
      isClearing: false
    })
  }

  // 确认清空回收站
  const confirmClearAll = async () => {
    try {
      setClearAllModal(prev => ({ ...prev, isClearing: true }))
      
      // 清空回收站只需要清空localStorage即可
      // 因为思维导图已经从后端数据库删除了，这里只是清理本地缓存
      localStorage.setItem('trashedMindmaps', JSON.stringify([]))
      
      // 更新当前列表
      setTrashedMindmaps([])
      
      // 通知其他页面数据已变化
      window.dispatchEvent(new CustomEvent('trashedChanged'))
      
      setSuccessMessage('回收站已清空')
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (error) {
      console.error('清空回收站失败:', error)
      setError('清空失败，请重试')
      setTimeout(() => setError(null), 5000)
    } finally {
      setClearAllModal({
        isOpen: false,
        isClearing: false
      })
    }
  }

  // 取消清空回收站
  const cancelClearAll = () => {
    setClearAllModal({
      isOpen: false,
      isClearing: false
    })
  }

  // 搜索逻辑
  const filteredMindmaps = trashedMindmaps
    .filter(mindmap => mindmap.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // 按删除时间排序，最近删除的在前
      const dateA = new Date(a.deletedAt)
      const dateB = new Date(b.deletedAt)
      return dateB - dateA
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

          {/* 回收站提示和操作栏 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">回收站说明</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    删除的思维导图会在回收站保留30天，过期后将自动永久删除。您可以在此期间恢复或永久删除它们。
                  </p>
                </div>
              </div>
              {trashedMindmaps.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  清空回收站
                </button>
              )}
            </div>
          </div>

          {/* 搜索控件 */}
          <div className="flex justify-start items-center mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="搜索回收站中的思维导图..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl border overflow-hidden min-h-[200px] animate-pulse">
                  <div className="bg-gray-200 h-32"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMindmaps.length > 0 ? (
            <>
              {/* 回收站思维导图卡片网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedMindmaps.map((mindmap, index) => {
                  const daysLeft = getDaysUntilPermanentDelete(mindmap.deletedAt)
                  return (
                    <div 
                      key={mindmap.id} 
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col relative opacity-75"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* 动态预览图 */}
                      <div className="h-32 overflow-hidden relative bg-gray-100">
                        <MindmapThumbnail 
                          content={mindmap.content} 
                          title={mindmap.title}
                          className="w-full h-full grayscale"
                        />
                        {/* 删除标识 */}
                        <div className="absolute top-2 right-2">
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        {/* 剩余天数标识 */}
                        <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {daysLeft}天后删除
                        </div>
                      </div>
                      
                      <div className="p-4 flex-grow">
                        <h3 className="font-semibold text-gray-800 truncate" title={mindmap.title}>
                          {mindmap.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(mindmap.deletedAt)} 删除
                        </p>
                      </div>
                      
                      <div className="border-t border-gray-100 p-3 flex justify-end space-x-2 bg-gray-50">
                        <button 
                          onClick={(e) => handleRestore(e, mindmap)} 
                          className="p-2 rounded-lg text-green-500 hover:bg-green-100 hover:text-green-600 transition-all duration-200"
                          title="恢复思维导图"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handlePermanentDelete(e, mindmap)} 
                          className="p-2 rounded-lg text-red-500 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                          title="永久删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
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
              <Trash2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                {searchTerm ? '没有找到匹配的项目' : '回收站是空的'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? '尝试使用不同的搜索词' : '删除的思维导图会出现在这里'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 恢复确认弹窗 */}
      {restoreModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <RotateCcw className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">确认恢复</h3>
                <p className="text-sm text-gray-500">恢复后可以正常访问</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              确定要恢复思维导图 <span className="font-semibold">"{restoreModal.mindmapTitle}"</span> 吗？
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRestore}
                disabled={restoreModal.isRestoring}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmRestore}
                disabled={restoreModal.isRestoring}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {restoreModal.isRestoring ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    恢复中...
                  </>
                ) : (
                  '确认恢复'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 永久删除确认弹窗 */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">永久删除</h3>
                <p className="text-sm text-gray-500">此操作无法撤销</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              确定要永久删除思维导图 <span className="font-semibold">"{deleteModal.mindmapTitle}"</span> 吗？删除后无法恢复。
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelPermanentDelete}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmPermanentDelete}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {deleteModal.isDeleting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    删除中...
                  </>
                ) : (
                  '永久删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清空回收站确认弹窗 */}
      {clearAllModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">清空回收站</h3>
                <p className="text-sm text-gray-500">此操作无法撤销</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              确定要清空整个回收站吗？所有项目都将被永久删除，无法恢复。
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelClearAll}
                disabled={clearAllModal.isClearing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmClearAll}
                disabled={clearAllModal.isClearing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {clearAllModal.isClearing ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    清空中...
                  </>
                ) : (
                  '确认清空'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}