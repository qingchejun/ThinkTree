/**
 * 公开分享页面 - ThinkSo v3.0.0
 * 无需登录即可查看分享的思维导图
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SimpleMarkmapBasic from '../../../components/mindmap/SimpleMarkmapBasic'

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const shareToken = params.token
  
  // 页面状态管理
  const [mindmap, setMindmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isClient, setIsClient] = useState(false)

  // 稳定化mindmapData引用
  const stableMindmapData = useMemo(() => {
    return mindmap ? {
      title: mindmap.title,
      markdown: mindmap.content
    } : null
  }, [mindmap])

  // 初始化客户端状态
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 获取分享的思维导图
  useEffect(() => {
    if (!isClient) return;
    const fetchSharedMindmap = async () => {
      if (!shareToken) {
        setError('分享链接无效')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/share/${shareToken}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setMindmap(data.mindmap)
        } else if (response.status === 404) {
          setError('分享链接不存在或已失效')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || '获取分享内容失败')
        }
      } catch (err) {
        console.error('获取分享内容失败:', err)
        setError(err.message || '网络连接失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedMindmap()
  }, [shareToken, isClient])

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 主内容区 - 全屏显示 */}
      <main className="w-full h-screen">
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载分享内容...</p>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">访问失败</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.reload()
                    }
                  }}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  重新加载
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 思维导图内容 - 全屏显示 */}
        {!loading && !error && mindmap && (
          <div className="w-full h-full">
            {stableMindmapData && (
              <SimpleMarkmapBasic
                mindmapData={stableMindmapData}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}