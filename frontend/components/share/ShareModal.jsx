/**
 * 分享对话框组件 - ThinkSo v3.0.0
 * 用于生成和管理思维导图分享链接
 */
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
// 移除ToastManager，使用内联提示样式

export default function ShareModal({ isOpen, onClose, mindmapId, mindmapTitle }) {
  const { user } = useAuth()
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
    if (isOpen && mindmapId && user) {
      fetchShareInfo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mindmapId, user])

  const fetchShareInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}/share`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
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
          credentials: 'include',
          headers: {
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
          credentials: 'include',
          headers: {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* 对话框头部 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              分享思维导图
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2 font-medium">
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
                <div className="space-y-5">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-green-900">思维导图已公开分享</h4>
                        <p className="text-sm text-green-700 mt-1">
                          任何人都可以通过分享链接查看此思维导图
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 分享链接 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      分享链接
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        readOnly
                        value={isClient ? `${window.location.origin}${shareInfo.share_url}` : shareInfo.share_url || ''}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>复制</span>
                      </button>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {shareInfo.updated_at && (
                        <p className="font-medium">更新于: {new Date(shareInfo.updated_at).toLocaleString('zh-CN')}</p>
                      )}
                    </div>
                    <button
                      onClick={handleDisableShare}
                      disabled={loading}
                      className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                      </svg>
                      <span>禁用分享</span>
                    </button>
                  </div>
                </div>
              ) : (
                // 未分享状态
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-blue-900 mb-3">关于公开分享</h4>
                        <ul className="text-sm text-blue-700 space-y-2">
                          <li className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span>创建分享链接后，任何人都可以查看此思维导图</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span>分享的内容是只读的，无法编辑</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span>您可以随时禁用分享链接</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span>分享不会显示您的个人信息</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateShare}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>创建分享链接</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 对话框底部 */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleClose}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
} 