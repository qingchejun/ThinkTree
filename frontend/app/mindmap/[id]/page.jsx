/**
 * 思维导图查看页面 - ThinkTree v3.0.0 (重构版)
 * 显示用户保存的思维导图 + 导出功能
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { useMindmap } from '../../../hooks/useMindmap.js'
import SimpleMarkmapBasic from '../../../components/mindmap/SimpleMarkmapBasic'
import ShareModal from '../../../components/share/ShareModal'
import MindmapHeader from '../../../components/mindmap/MindmapHeader.jsx'
import DeleteConfirmationModal from '../../../components/mindmap/DeleteConfirmationModal.jsx'
// 移除ToastManager，使用内联提示样式
import { exportSVG, exportPNG, getSafeFilename, getTimestamp } from '../../../lib/exportUtils.js'

export default function ViewMindmapPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const mindmapId = params.id
  const exportFormat = searchParams.get('export')
  
  // 使用自定义Hook获取思维导图数据
  const { mindmap, setMindmap, loading, error, setError, stableMindmapData } = useMindmap(mindmapId)
  
  // 页面状态管理
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
  
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // 删除确认弹窗状态
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Markmap 组件引用
  const markmapRef = useRef(null)

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/')
      return
    }
  }, [user, isAuthLoading, router])

  // 初始化收藏状态
  useEffect(() => {
    if (mindmap) {
      const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
      setIsFavorited(favoriteIds.includes(mindmap.id))
    }
  }, [mindmap])

  // 自动导出功能 - 根据URL参数触发PNG导出
  useEffect(() => {
    if (exportFormat === 'png' && mindmap && markmapRef.current && !isExportingRef.current) {
      const triggerAutoExport = async () => {
        // 等待思维导图完全加载
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        handleExport(exportPNG, 'PNG')
        
        // 导出完成后，移除URL参数
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
      
      triggerAutoExport()
    }
  }, [exportFormat, mindmap, markmapRef.current])

  // 删除思维导图
  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
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
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // 更新标题
  const handleUpdateTitle = async (newTitle) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle
        }),
      })

      if (response.ok) {
        const updatedMindmap = await response.json()
        setMindmap(updatedMindmap)
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

  // 处理收藏/取消收藏
  const handleToggleFavorite = () => {
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
    const isCurrentlyFavorited = favoriteIds.includes(mindmap.id)
    
    if (isCurrentlyFavorited) {
      const newFavoriteIds = favoriteIds.filter(id => id !== mindmap.id)
      localStorage.setItem('favoriteMindmaps', JSON.stringify(newFavoriteIds))
    } else {
      favoriteIds.push(mindmap.id)
      localStorage.setItem('favoriteMindmaps', JSON.stringify(favoriteIds))
    }
    
    setIsFavorited(!isCurrentlyFavorited)
    setSuccessMessage(isCurrentlyFavorited ? `已取消收藏"${mindmap.title}"` : `已收藏"${mindmap.title}"`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // 统一导出处理函数
  const handleExport = async (exportFunc, format) => {
    if (!markmapRef.current || isExportingRef.current) {
      setError('思维导图未准备就绪或正在导出中，请稍后重试')
      setTimeout(() => setError(null), 3000)
      return
    }
    isExportingRef.current = true
    setIsExportingUI(true)
    setShowExportMenu(false) // 关闭导出菜单
    try {
      // 先设置组件处理状态，防止任何重新渲染
      markmapRef.current.setProcessing(true)
      await new Promise(resolve => setTimeout(resolve, 50)) // 稍微延迟，确保处理状态已经生效

      const markmapInstance = markmapRef.current.getMarkmapInstance()
      if (!markmapInstance) throw new Error('无法获取思维导图实例')
      const filename = `${getSafeFilename(mindmap.title)}_${getTimestamp()}`
      setSuccessMessage(`正在生成 ${format} 文件，请稍候...`)
      const result = await exportFunc(markmapInstance, filename, 2) // 2x分辨率
      if (!result.success) throw new Error(result.error)
      setSuccessMessage(`${format} 文件导出成功: ${result.filename}`)
    } catch (err) {
      console.error(`${format} 导出失败:`, err)
      setError(`${format} 导出失败: ${err.message}`)
    } finally {
      isExportingRef.current = false
      setIsExportingUI(false)
      // 延迟恢复组件正常状态，确保所有状态变化完成
      setTimeout(() => {
        if (markmapRef.current) {
          markmapRef.current.setProcessing(false)
        }
      }, 100)
      setTimeout(() => setSuccessMessage(null), 3000) // 清除成功消息
      setTimeout(() => setError(null), 3000) // 清除错误消息
    }
  }

  // 全屏功能处理
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('无法进入全屏模式:', err)
        setError('无法进入全屏模式')
        setTimeout(() => setError(null), 3000)
      })
    } else {
      document.exitFullscreen().catch(err => {
        console.error('无法退出全屏模式:', err)
        setError('无法退出全屏模式')
        setTimeout(() => setError(null), 3000)
      })
    }
  }

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // 加载状态
  if (isAuthLoading || loading) {
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
            <MindmapHeader
              mindmap={mindmap}
              onUpdateTitle={handleUpdateTitle}
              onDelete={() => setShowDeleteModal(true)}
              onShare={handleShareClick}
              onToggleFavorite={handleToggleFavorite}
              isFavorited={isFavorited}
              onExportSVG={() => handleExport(exportSVG, 'SVG')}
              onExportPNG={() => handleExport(exportPNG, 'PNG')}
              isExportingUI={isExportingUI}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              showExportMenu={showExportMenu}
              setShowExportMenu={setShowExportMenu}
            />

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
        onClose={() => setShareModal({ isOpen: false, mindmapId: null, mindmapTitle: '' })}
        mindmapId={shareModal.mindmapId}
        mindmapTitle={shareModal.mindmapTitle}
      />

      {/* 删除确认弹窗 */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        mindmapTitle={mindmap?.title}
      />
    </div>
  )
}