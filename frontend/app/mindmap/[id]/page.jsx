/**
 * 思维导图查看页面 - ThinkTree v3.0.0 (Refactored)
 * 显示用户保存的思维导图 + 导出功能
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useMindmap } from '@/hooks/useMindmap'
import SimpleMarkmapBasic from '@/components/mindmap/SimpleMarkmapBasic'
import ShareModal from '@/components/share/ShareModal'
import MindmapHeader from '@/components/mindmap/MindmapHeader'
import DeleteConfirmationModal from '@/components/mindmap/DeleteConfirmationModal'
import { exportSVG, exportPNG, getSafeFilename, getTimestamp } from '@/lib/exportUtils.js'

export default function ViewMindmapPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const mindmapId = params.id

  const { mindmap, setMindmap, loading, error, setError, stableMindmapData } = useMindmap(mindmapId)

  const [successMessage, setSuccessMessage] = useState(null)
  const [isExportingUI, setIsExportingUI] = useState(false)
  const [shareModal, setShareModal] = useState({ isOpen: false, mindmapId: null, mindmapTitle: '' })
  const [isFavorited, setIsFavorited] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const markmapRef = useRef(null)
  const isExportingRef = useRef(false)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/')
    }
  }, [user, isAuthLoading, router])

  useEffect(() => {
    if (mindmap) {
      const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
      setIsFavorited(favoriteIds.includes(mindmap.id))
    }
  }, [mindmap])

  const handleUpdateTitle = async (newTitle) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      if (!response.ok) throw new Error('标题修改失败')
      const updatedMindmap = await response.json()
      setMindmap(updatedMindmap)
      setSuccessMessage('标题修改成功')
    } catch (err) {
      setError(`标题修改失败: ${err.message}`)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('删除失败')
      setSuccessMessage(`思维导图 \"${mindmap.title}\" 已成功删除`)
      router.push('/mindmaps')
    } catch (err) {
      setError(`删除失败: ${err.message}`)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleToggleFavorite = () => {
    const favoriteIds = JSON.parse(localStorage.getItem('favoriteMindmaps') || '[]')
    const isCurrentlyFavorited = favoriteIds.includes(mindmap.id)
    const newFavoriteIds = isCurrentlyFavorited
      ? favoriteIds.filter(id => id !== mindmap.id)
      : [...favoriteIds, mindmap.id]
    localStorage.setItem('favoriteMindmaps', JSON.stringify(newFavoriteIds))
    setIsFavorited(!isCurrentlyFavorited)
    setSuccessMessage(isCurrentlyFavorited ? '已取消收藏' : '已收藏')
  }

  const handleExport = async (exportFunc, format) => {
    if (!markmapRef.current || isExportingRef.current) return
    isExportingRef.current = true
    setIsExportingUI(true)
    try {
      const markmapInstance = markmapRef.current.getMarkmapInstance()
      if (!markmapInstance) throw new Error('无法获取思维导图实例')
      const filename = `${getSafeFilename(mindmap.title)}_${getTimestamp()}`
      setSuccessMessage(`正在生成 ${format} 文件...`)
      const result = await exportFunc(markmapInstance, filename, 2)
      if (!result.success) throw new Error(result.error)
      setSuccessMessage(`${format} 文件导出成功: ${result.filename}`)
    } catch (err) {
      setError(`${format} 导出失败: ${err.message}`)
    } finally {
      isExportingRef.current = false
      setIsExportingUI(false)
    }
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => setError('无法进入全屏模式'))
    } else {
      document.exitFullscreen().catch(err => setError('无法退出全屏模式'))
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (isAuthLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">加载中...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">错误: {error}</div>
  }

  if (!mindmap) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">未找到思维导图。</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {successMessage && <div className="fixed top-4 right-4 bg-green-100 text-green-700 px-4 py-3 rounded z-50">{successMessage}</div>}
      
      <div className="h-screen flex flex-col">
        <MindmapHeader
          mindmap={mindmap}
          onUpdateTitle={handleUpdateTitle}
          onDelete={() => setShowDeleteModal(true)}
          onShare={() => setShareModal({ isOpen: true, mindmapId, mindmapTitle: mindmap.title })}
          onToggleFavorite={handleToggleFavorite}
          isFavorited={isFavorited}
          onExportSVG={() => handleExport(exportSVG, 'SVG')}
          onExportPNG={() => handleExport(exportPNG, 'PNG')}
          isExportingUI={isExportingUI}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
        <div className="flex-1 h-[calc(100%-81px)]">
          <SimpleMarkmapBasic ref={markmapRef} mindmapData={stableMindmapData} />
        </div>
      </div>

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, mindmapId: null, mindmapTitle: '' })}
        mindmapId={shareModal.mindmapId}
        mindmapTitle={shareModal.mindmapTitle}
      />

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