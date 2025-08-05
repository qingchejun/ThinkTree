/**
 * 思维导图查看页面 - ThinkTree v3.0.0
 * 显示用户保存的思维导图 + 导出功能
 */
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import SimpleMarkmapBasic from '../../../components/mindmap/SimpleMarkmapBasic'
import ShareModal from '../../../components/share/ShareModal'
// 移除ToastManager，使用内联提示样式
import { exportSVG, exportPNG, getSafeFilename, getTimestamp } from '../../../lib/exportUtils.js'
import { Download, Share2, Trash2, ChevronDown, ArrowLeft, Eye, Star, Check, X } from 'lucide-react'

export default function ViewMindmapPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const mindmapId = params.id
  const exportFormat = searchParams.get('export')
  
  // 页面状态管理
  const [mindmap, setMindmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null) // 成功消息状态
  
  // 导出功能状态 - 使用 useRef 避免重新渲染
  const isExportingRef = useRef(false)
  const [isExportingUI, setIsExportingUI] = useState(false) // 仅用于UI显示
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // 分享模态框状态
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    mindmapId: null,
    mindmapTitle: ''
  })
  
  // 收藏状态
  const [isFavorited, setIsFavorited] = useState(false)
  
  // 标题编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  
  // Markmap 组件引用
  const markmapRef = useRef(null)

  // 稳定化mindmapData引用，避免不必要的子组件重新渲染
  const stableMindmapData = useMemo(() => {
    return mindmap ? {
      title: mindmap.title,
      markdown: mindmap.content
    } : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mindmap?.title, mindmap?.content])

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }
  }, [user, isLoading, router])

  // 获取思维导图详情
  useEffect(() => {
    const fetchMindmap = async () => {
      if (!mindmapId) return

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
          
          // 检查是否已收藏
          const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
          setIsFavorited(favoriteIds.includes(data.id))
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

    if (token && user) { // 确保token和用户信息加载后再获取
      fetchMindmap()
    }
  }, [token, user, mindmapId])

  // 自动导出功能 - 根据URL参数触发PNG导出
  useEffect(() => {
    if (exportFormat === 'png' && mindmap && markmapRef.current && !isExportingRef.current) {
      const triggerAutoExport = async () => {
        // 等待思维导图完全加载
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        handleExportPNG()
        
        // 导出完成后，移除URL参数
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
      
      triggerAutoExport()
    }
  }, [exportFormat, mindmap, markmapRef.current])

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
        setSuccessMessage(`思维导图"${mindmap.title}"已成功删除`)
        router.push('/mindmaps')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '删除失败')
      }
    } catch (err) {
      console.error('删除思维导图失败:', err)
      setError(`删除失败: ${err.message}`)
    }
  }

  // 打开分享模态框
  const handleShareClick = () => {
    setShareModal({
      isOpen: true,
      mindmapId: mindmapId,
      mindmapTitle: mindmap?.title || ''
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

  // 处理收藏/取消收藏
  const handleToggleFavorite = () => {
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
    const isCurrentlyFavorited = favoriteIds.includes(mindmap.id)
    
    if (isCurrentlyFavorited) {
      const newFavoriteIds = favoriteIds.filter(id => id !== mindmap.id)
      localStorage.setItem('favoriteMindmaps', JSON.stringify(newFavoriteIds))
      setIsFavorited(false)
      setSuccessMessage(`已取消收藏"${mindmap.title}"`)
    } else {
      favoriteIds.push(mindmap.id)
      localStorage.setItem('favoriteMindmaps', JSON.stringify(favoriteIds))
      setIsFavorited(true)
      setSuccessMessage(`已收藏"${mindmap.title}"`)
    }
    
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // 开始编辑标题
  const handleStartEditTitle = () => {
    setEditingTitle(mindmap.title)
    setIsEditingTitle(true)
  }

  // 保存标题
  const handleSaveTitle = async () => {
    if (isSavingTitle) return // 防止重复调用
    
    if (!editingTitle.trim()) {
      setError('标题不能为空')
      return
    }

    if (editingTitle.trim() === mindmap.title) {
      setIsEditingTitle(false)
      return
    }

    try {
      setIsSavingTitle(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingTitle.trim()
        }),
      })

      if (response.ok) {
        const updatedMindmap = await response.json()
        setMindmap(updatedMindmap)
        setIsEditingTitle(false)
        setSuccessMessage('标题修改成功')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '标题修改失败')
      }
    } catch (err) {
      console.error('标题修改失败:', err)
      setError(`标题修改失败: ${err.message}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsSavingTitle(false)
    }
  }

  // 取消编辑标题
  const handleCancelEditTitle = () => {
    setEditingTitle('')
    setIsEditingTitle(false)
    setIsSavingTitle(false)
  }

  // 处理键盘事件
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditTitle()
    }
  }

  // 导出SVG（最终优化版 + 调试版）
  const handleExportSVG = async () => {
    
    if (!markmapRef.current) {
      setError('思维导图未准备就绪，请稍后重试')
      return
    }

    try {
      // 先设置组件处理状态，防止任何重新渲染
      markmapRef.current.setProcessing(true)
      
      // 稍微延迟，确保处理状态已经生效
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // 设置父组件导出状态
      isExportingRef.current = true
      setIsExportingUI(true)
      
      // 获取markmap实例
      const markmapInstance = markmapRef.current.getMarkmapInstance()
      
      if (!markmapInstance) {
        throw new Error('无法获取思维导图实例')
      }

      // 生成文件名
      const safeTitle = getSafeFilename(mindmap.title)
      const timestamp = getTimestamp()
      const filename = `${safeTitle}_${timestamp}`
      
      const result = exportSVG(markmapInstance, filename)
      
      if (result.success) {
        setSuccessMessage(`SVG文件导出成功: ${result.filename}`)
        setShowExportMenu(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setError(`SVG导出失败: ${error.message}`)
    } finally {
        isExportingRef.current = false
        setIsExportingUI(false)
        // 延迟恢复组件正常状态，确保所有状态变化完成
        setTimeout(() => {
          if (markmapRef.current) {
            markmapRef.current.setProcessing(false)
          }
        }, 100)
      }
    }

  // 导出PNG（最终优化版 + 调试版）
  const handleExportPNG = async () => {
    
    if (!markmapRef.current) {
      setError('思维导图未准备就绪，请稍后重试')
      return
    }

    try {
      // 先设置组件处理状态，防止任何重新渲染
      markmapRef.current.setProcessing(true)
      
      // 稍微延迟，确保处理状态已经生效
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // 设置isExporting状态
      isExportingRef.current = true
      setIsExportingUI(true)
      
      // 获取markmap实例
      const markmapInstance = markmapRef.current.getMarkmapInstance()
      
      if (!markmapInstance) {
        throw new Error('无法获取思维导图实例')
      }

      // 生成文件名
      const safeTitle = getSafeFilename(mindmap.title)
      const timestamp = getTimestamp()
      const filename = `${safeTitle}_${timestamp}`
      
      setSuccessMessage('正在生成PNG文件，请稍候...')
      
      const result = await exportPNG(markmapInstance, filename, 2) // 2x分辨率
      
      if (result.success) {
        setSuccessMessage(`PNG文件导出成功: ${result.filename}`)
        setShowExportMenu(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setError(`PNG导出失败: ${error.message}`)
    } finally {
        isExportingRef.current = false
        setIsExportingUI(false)
        // 延迟恢复组件正常状态，确保所有状态变化完成
        setTimeout(() => {
          if (markmapRef.current) {
            markmapRef.current.setProcessing(false)
          }
        }, 100)
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
                onClick={() => router.push('/mindmaps')}
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
              onClick={() => router.push('/mindmaps')}
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
      {/* 成功/错误消息 */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}

      {/* 思维导图信息区 */}
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
        <div className="h-screen">
          <div className="h-full bg-white border border-gray-200 mx-4 my-4 rounded-lg shadow-sm">
            {/* 整合的标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4 flex-1">
                <button
                  onClick={() => router.push('/mindmaps')}
                  className="action-button text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  title="返回控制台"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                  {isEditingTitle ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        onBlur={(e) => {
                          // 延迟执行onBlur，让按钮点击事件优先执行
                          setTimeout(() => {
                            if (isEditingTitle && !isSavingTitle) {
                              handleSaveTitle()
                            }
                          }, 200)
                        }}
                        className="text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 flex-1"
                        placeholder="请输入标题"
                        autoFocus
                        maxLength={100}
                      />
                      <button
                        onClick={handleSaveTitle}
                        disabled={isSavingTitle}
                        className="action-button text-green-500 hover:bg-green-100 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="保存标题"
                      >
                        {isSavingTitle ? (
                          <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEditTitle}
                        disabled={isSavingTitle}
                        className="action-button text-red-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="取消编辑"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h1 
                      className="text-xl font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      onClick={handleStartEditTitle}
                      title="点击编辑标题"
                    >
                      {mindmap.title}
                    </h1>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    创建于 {formatDate(mindmap.created_at)}
                    {mindmap.updated_at !== mindmap.created_at && (
                      <span> · 更新于 {formatDate(mindmap.updated_at)}</span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* 操作按钮组 */}
              <div className="flex items-center space-x-2">
                {/* 导出按钮 */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExportingUI}
                    className="action-button text-purple-500 hover:bg-purple-100 hover:text-purple-600 disabled:opacity-50"
                    title="导出思维导图"
                  >
                    {isExportingUI ? (
                      <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* 导出下拉菜单 */}
                  {showExportMenu && !isExportingUI && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={handleExportSVG}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="mr-3">🎨</span>
                          <div className="text-left">
                            <div className="font-medium">导出为 SVG</div>
                            <div className="text-xs text-gray-500">矢量格式，可缩放</div>
                          </div>
                        </button>
                        <button
                          onClick={handleExportPNG}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="mr-3">🖼️</span>
                          <div className="text-left">
                            <div className="font-medium">导出为 PNG</div>
                            <div className="text-xs text-gray-500">位图格式，高分辨率</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleShareClick}
                  className="action-button text-blue-500 hover:bg-blue-100 hover:text-blue-600"
                  title="分享思维导图"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleToggleFavorite}
                  className={`action-button ${isFavorited ? 'text-yellow-500 hover:bg-yellow-100 hover:text-yellow-600' : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'}`}
                  title={isFavorited ? '取消收藏' : '收藏'}
                >
                  {isFavorited ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={handleDelete}
                  className="action-button text-red-500 hover:bg-red-100 hover:text-red-600"
                  title="删除思维导图"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 思维导图可视化区域 */}
            <div className="h-[calc(100%-81px)]">
              <SimpleMarkmapBasic 
                ref={markmapRef}
                mindmapData={stableMindmapData}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 点击外部关闭导出菜单 */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)}
        ></div>
      )}

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