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
import dynamic from 'next/dynamic'
// 暂时隐藏 ReactFlow，保留代码但不再作为默认“高级画布”
const OutlineMindmap = dynamic(() => import('../../../components/mindmap/OutlineMindmap.jsx'), { ssr: false })
import ShareModal from '../../../components/share/ShareModal'
import MindmapHeader from '../../../components/mindmap/MindmapHeader.jsx'
import DeleteConfirmationModal from '../../../components/mindmap/DeleteConfirmationModal.jsx'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
// 移除ToastManager，使用内联提示样式
import { exportSVG, exportPNG, getSafeFilename, getTimestamp } from '../../../lib/exportUtils.js'
import { useToast } from '../../../hooks/useToast.js'

export default function ViewMindmapPage() {
  const toast = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const mindmapId = params.id
  const exportFormat = searchParams.get('export')
  const rfParam = searchParams.get('rf')
  const [useRF, setUseRF] = useState(false)

  // 特性开关：URL ?rf=1 优先，其次 localStorage('rf_beta')
  useEffect(() => {
    const fromUrl = rfParam === '1'
    const fromLocal = typeof window !== 'undefined' && localStorage.getItem('rf_beta') === '1'
    setUseRF(!!(fromUrl || fromLocal))
  }, [rfParam])
  
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
  const [isEditMode, setIsEditMode] = useState(false)
  
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

  // 记录访问历史
  useEffect(() => {
    if (mindmap && mindmap.id) {
      const recordVisit = () => {
        const recentIds = JSON.parse(localStorage.getItem('recentMindmaps') || '[]')
        const existingIndex = recentIds.findIndex(item => item.id === mindmap.id)
        
        const visitRecord = {
          id: mindmap.id,
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
        
        // 通知其他页面数据已变化
        window.dispatchEvent(new CustomEvent('recentChanged'))
      }
      
      recordVisit()
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
      
      // 先将思维导图添加到回收站
      const trashedData = JSON.parse(localStorage.getItem('trashedMindmaps') || '[]')
      const trashedItem = {
        ...mindmap,
        deletedAt: new Date().toISOString()
      }
      console.log('详情页删除: 添加到回收站的项目:', trashedItem)
      trashedData.unshift(trashedItem)
      localStorage.setItem('trashedMindmaps', JSON.stringify(trashedData))
      console.log('详情页删除: 回收站数据已更新，当前总数:', trashedData.length)
      
      // 调用API删除
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // 从收藏和最近访问中移除
        const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
        const newFavoriteIds = favoriteIds.filter(id => id !== mindmapId)
        localStorage.setItem('favoriteMindmaps', JSON.stringify(newFavoriteIds))
        
        const recentIds = JSON.parse(localStorage.getItem('recentMindmaps') || '[]')
        const newRecentIds = recentIds.filter(item => item.id !== mindmapId)
        localStorage.setItem('recentMindmaps', JSON.stringify(newRecentIds))
        
        // 通知其他页面数据已变化
        window.dispatchEvent(new CustomEvent('favoritesChanged'))
        window.dispatchEvent(new CustomEvent('recentChanged'))
        window.dispatchEvent(new CustomEvent('trashedChanged'))
        
        setSuccessMessage(`思维导图"${mindmap.title}"已移动到回收站`)
        router.push('/mindmaps')
      } else {
        // 如果API调用失败，从回收站中移除刚刚添加的项目
        const currentTrashedData = JSON.parse(localStorage.getItem('trashedMindmaps') || '[]')
        const rollbackTrashedData = currentTrashedData.filter(item => item.id !== mindmapId)
        localStorage.setItem('trashedMindmaps', JSON.stringify(rollbackTrashedData))
        
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
      toast.error('思维导图未准备就绪或正在导出中')
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
      setSuccessMessage(`正在生成 ${format} 文件...`)
      const result = await exportFunc(markmapInstance, filename, 2) // 2x分辨率
      if (!result.success) throw new Error(result.error)
      setSuccessMessage(`${format} 已导出`)
    } catch (err) {
      console.error(`${format} 导出失败:`, err)
      toast.error(`${format} 导出失败：${err.message}`)
    } finally {
      isExportingRef.current = false
      setIsExportingUI(false)
      // 延迟恢复组件正常状态，确保所有状态变化完成
      setTimeout(() => {
        if (markmapRef.current) {
          markmapRef.current.setProcessing(false)
        }
      }, 100)
      setTimeout(() => setSuccessMessage(null), 1000)
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
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-core-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-600">加载思维导图中...</p>
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
      <div className="min-h-screen bg-brand-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center border border-error-200 bg-error-50">
            <div className="text-error-600 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-error-900 mb-2">加载失败</h2>
            <p className="text-error-700 mb-6">{error}</p>
            <div className="flex items-center justify-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/mindmaps')} className="text-brand-800 hover:bg-brand-100">← 返回控制台</Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-error-600 hover:bg-error-100 hover:text-error-700">重新加载</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // 思维导图不存在
  if (!mindmap) {
    return (
      <div className="min-h-screen bg-brand-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card variant="feature" className="text-center py-12 rounded-2xl border-2 border-dashed border-brand-200">
            <div className="mb-2"><Badge variant="feature" size="sm">提示</Badge></div>
            <div className="text-brand-400 text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-brand-900 mb-2">思维导图不存在</h2>
            <p className="text-brand-600 mb-6">您要查看的思维导图可能已被删除或您没有访问权限</p>
            <Button variant="feature" size="sm" onClick={() => router.push('/mindmaps')}>← 返回控制台</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* 成功/错误消息 */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded z-50">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}

      {/* 思维导图信息区 */}
      {(mindmap.description || (mindmap.tags && mindmap.tags.length > 0)) && (
        <div className="bg-core-50 border-b border-core-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {mindmap.description && (
              <Card className="p-3 mb-3 bg-white border border-brand-200">
                <p className="text-core-700">{mindmap.description}</p>
              </Card>
            )}
            {mindmap.tags && mindmap.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-core-700 text-sm font-medium">标签:</span>
                {mindmap.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" size="xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 思维导图展示区 */}
      <div className="flex-1">
        <div className="h-screen">
          <div className="h-full bg-white border border-brand-200 mx-4 my-4 rounded-lg shadow-sm">
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
              extraActions={[
                (
                  <button key="rf-toggle" onClick={() => {
                    const next = !useRF
                    setUseRF(next)
                    if (typeof window !== 'undefined') localStorage.setItem('rf_beta', next ? '1' : '0')
                  }} className="px-2 py-1 text-xs border rounded">
                    {useRF ? '切换Markmap' : '高级画布(beta)'}
                  </button>
                )
              ]}
                onToggleEditMode={() => setIsEditMode(prev => !prev)}
                isEditMode={isEditMode}
            />

            {/* 思维导图可视化区域 */}
            <div className="h-[calc(100%-81px)]">
              {useRF ? (
                <OutlineMindmap
                  editable={isEditMode}
                  markdown={stableMindmapData?.markdown || ''}
                  mindmapId={mindmapId}
                  meta={{
                    title: mindmap?.title,
                    description: mindmap?.description,
                    tags: mindmap?.tags,
                    is_public: mindmap?.is_public,
                  }}
                  onSaved={() => {
                    setSuccessMessage('已保存更改')
                    setTimeout(() => setSuccessMessage(null), 2000)
                  }}
                />
              ) : (
                <SimpleMarkmapBasic ref={markmapRef} mindmapData={stableMindmapData} />
              )}
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