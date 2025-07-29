/**
 * 思维导图查看页面 - ThinkTree v3.0.0
 * 显示用户保存的思维导图 + 导出功能
 */
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import SimpleMarkmapBasic from '../../../components/mindmap/SimpleMarkmapBasic'
import ShareModal from '../../../components/share/ShareModal'
// 移除ToastManager，使用内联提示样式
import { exportSVG, exportPNG, getSafeFilename, getTimestamp } from '../../../lib/exportUtils.js'

export default function ViewMindmapPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const mindmapId = params.id
  
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
  
  // Markmap 组件引用
  const markmapRef = useRef(null)

  // 稳定化mindmapData引用，避免不必要的子组件重新渲染
  const stableMindmapData = useMemo(() => {
    return mindmap ? {
      title: mindmap.title,
      markdown: mindmap.content
    } : null
  }, [mindmap?.title, mindmap?.content])

  // 路由保护 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, isLoading, router])

  // 获取思维导图详情
  useEffect(() => {
    const fetchMindmap = async () => {
      if (!token || !user || !mindmapId) return

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

    fetchMindmap()
  }, [token, user, mindmapId])

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
        router.push('/dashboard')
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
                onClick={() => router.push('/dashboard')}
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
              onClick={() => router.push('/dashboard')}
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
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  ← 返回控制台
                </button>
                <div className="border-l border-gray-300 h-6"></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {mindmap.title}
                  </h1>
                  <p className="text-sm text-gray-600">
                    创建于 {formatDate(mindmap.created_at)}
                    {mindmap.updated_at !== mindmap.created_at && (
                      <span> · 更新于 {formatDate(mindmap.updated_at)}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">👋 {user.email}</span>
              
              {/* 导出按钮 */}
              <div className="relative">
                                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExportingUI}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isExportingUI ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>导出中...</span>
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      <span>导出</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
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
                          <div className="text-xs text-gray-500">矢量格式，可缩放，文件小</div>
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
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                🔗 分享
              </button>
              <button
                onClick={() => alert('编辑功能开发中...')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                ✏️ 编辑
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                🗑️ 删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 点击外部关闭菜单 */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)}
        ></div>
      )}

      {/* 思维导图信息 */}
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
        <div className="h-[calc(100vh-140px)]">
          <div className="h-full bg-white border border-gray-200 mx-4 my-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">思维导图视图</h2>
              <div className="text-sm text-gray-500">
                Markmap 可视化 | 支持 SVG/PNG 导出
              </div>
            </div>
            <div className="h-[calc(100%-65px)]">
              <SimpleMarkmapBasic 
                ref={markmapRef}
                mindmapData={stableMindmapData}
              />
            </div>
          </div>
        </div>
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