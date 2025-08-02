/**
 * 分享对话框组件 - ThinkSo v3.0.0
 * 用于生成和管理思维导图分享链接
 */
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
// 移除ToastManager，使用内联提示样式

export default function ShareModal({ isOpen, onClose, mindmapId, mindmapTitle }) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [shareInfo, setShareInfo] = useState(null)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null) // 成功消息状态
  const [isClient, setIsClient] = useState(false) // 客户端检查

  // 检查是否在客户端
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 获取分享信息
  useEffect(() => {
    if (isOpen && mindmapId && token) {
      fetchShareInfo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mindmapId, token])

  const fetchShareInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}/share`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setShareInfo(data.share_info)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '获取分享信息失败')
      }
    } catch (err) {
      console.error('获取分享信息失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 创建分享链接
  const handleCreateShare = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}/share`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setShareInfo({
          is_shared: true,
          share_token: data.share_token,
          share_url: data.share_url,
          updated_at: new Date().toISOString()
        })
        setSuccessMessage(data.is_existing ? '使用现有分享链接' : '分享链接创建成功')
        // 3秒后清除成功消息
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '创建分享链接失败')
      }
    } catch (err) {
      console.error('创建分享链接失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 禁用分享
  const handleDisableShare = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}/share`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        setShareInfo({
          is_shared: false,
          share_token: null,
          share_url: null,
          updated_at: new Date().toISOString()
        })
        setSuccessMessage('分享已禁用')
        // 3秒后清除成功消息
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '禁用分享失败')
      }
    } catch (err) {
      console.error('禁用分享失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 复制链接
  const handleCopyLink = async () => {
    if (!shareInfo?.share_url || !isClient) return

    try {
      const fullUrl = `${window.location.origin}${shareInfo.share_url}`
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl)
        setSuccessMessage('分享链接已复制到剪贴板')
      } else {
        // 降级方案：使用传统的复制方法
        const textArea = document.createElement('textarea')
        textArea.value = fullUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setSuccessMessage('分享链接已复制到剪贴板')
      }
      
      // 2秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
      setError('复制失败，请手动复制')
    }
  }

  // 重置状态
  const handleClose = () => {
    setShareInfo(null)
    setError(null)
    setSuccessMessage(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 对话框头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              分享思维导图
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            &ldquo;{mindmapTitle}&rdquo;
          </p>
        </div>

        {/* 对话框内容 */}
        <div className="px-6 py-4">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">处理中...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-red-500 mr-3">⚠️</div>
                <div>
                  <h4 className="text-sm font-medium text-red-900">操作失败</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-green-500 mr-3">✅</div>
                <div>
                  <h4 className="text-sm font-medium text-green-900">操作成功</h4>
                  <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && shareInfo && (
            <div className="space-y-4">
              {shareInfo.is_shared ? (
                // 已分享状态
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="text-green-500 mr-3">✅</div>
                      <div>
                        <h4 className="text-sm font-medium text-green-900">思维导图已公开分享</h4>
                        <p className="text-sm text-green-700 mt-1">
                          任何人都可以通过分享链接查看此思维导图
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 分享链接 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分享链接
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={isClient ? `${window.location.origin}${shareInfo.share_url}` : shareInfo.share_url || ''}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-xs text-gray-500">
                      {shareInfo.updated_at && (
                        <p>更新于: {new Date(shareInfo.updated_at).toLocaleString('zh-CN')}</p>
                      )}
                    </div>
                    <button
                      onClick={handleDisableShare}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      禁用分享
                    </button>
                  </div>
                </div>
              ) : (
                // 未分享状态
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="text-blue-500 mr-3 mt-0.5">ℹ️</div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-2">关于公开分享</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• 创建分享链接后，任何人都可以查看此思维导图</li>
                          <li>• 分享的内容是只读的，无法编辑</li>
                          <li>• 您可以随时禁用分享链接</li>
                          <li>• 分享不会显示您的个人信息</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateShare}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    🔗 创建分享链接
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 对话框底部 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
} 