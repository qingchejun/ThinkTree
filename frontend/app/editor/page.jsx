/**
 * 思维导图编辑器页面
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import MarkmapView from '../../components/mindmap/MarkmapView'

function EditorContent() {
  const searchParams = useSearchParams()
  const [mindmapData, setMindmapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 从URL参数获取思维导图数据
    const dataParam = searchParams.get('data')
    
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam))
        setMindmapData(parsedData)
      } catch (err) {
        setError('数据解析失败')
        console.error('解析思维导图数据失败:', err)
      }
    } else {
      setError('缺少思维导图数据')
    }
    
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载编辑器...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back()
              }
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            返回上一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back()
              }
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {mindmapData?.data?.title || '思维导图编辑器'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            保存
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            分享
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            导出
          </button>
        </div>
      </header>

      {/* 思维导图编辑器 */}
      <main className="flex-1 bg-gray-50">
        <MarkmapView mindmapData={mindmapData?.data} />
      </main>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}