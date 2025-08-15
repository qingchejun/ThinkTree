'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import '../../styles/markmap.css'

/**
 * 思维导图缩略图组件
 * 用于在Dashboard卡片中显示实际的思维导图预览
 */
const MindmapThumbnail = ({ content, title, className = "" }) => {
  const svgRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [markmap, setMarkmap] = useState(null)
  const mmRef = useRef(null)

  useEffect(() => {
    let mounted = true
    try {
      const type = typeof content
      const length = type === 'string' ? content.length : 0
      console.log('=== MindmapThumbnail useEffect ===', { title, type, length })

      // 内容校验
      if (!content || type !== 'string' || content.trim() === '') {
        if (mounted) {
          setIsLoading(false)
          setHasError(false)
        }
        return () => { mounted = false }
      }

      const generateThumbnail = async () => {
        try {
          if (!svgRef.current) {
            if (mounted) {
              setHasError(true)
              setIsLoading(false)
            }
            return
          }

          // 动态导入
          const { Markmap } = await import('markmap-view')
          const { Transformer } = await import('markmap-lib')

          const transformer = new Transformer()
          const { root } = transformer.transform(content)
          if (!root) throw new Error('无法解析思维导图内容')

          const svg = svgRef.current
          if (!svg) throw new Error('SVG元素不存在')
          svg.innerHTML = ''
          svg.setAttribute('width', '100%')
          svg.setAttribute('height', '100%')
          svg.setAttribute('viewBox', '0 0 300 200')
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

          const mm = Markmap.create(svg, {
            duration: 0,
            zoom: false,
            pan: false,
            maxWidth: 200,
            spacingVertical: 8,
            spacingHorizontal: 40,
            paddingX: 8,
            color: (node) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
              return colors[node.depth % colors.length]
            },
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: (node) => Math.max(10, 14 - node.depth * 2),
          })
          mmRef.current = mm

          mm.setData(root)
          setTimeout(() => {
            try {
              if (mmRef.current && typeof mmRef.current.fit === 'function') {
                mmRef.current.fit()
              }
            } finally {
              if (mounted) setIsLoading(false)
            }
          }, 100)
        } catch (e) {
          console.error('生成思维导图缩略图失败:', e)
          if (mounted) {
            setHasError(true)
            setIsLoading(false)
          }
        }
      }

      // 延迟执行，确保DOM准备就绪
      const timer = setTimeout(generateThumbnail, 50)

      return () => {
        mounted = false
        clearTimeout(timer)
        try {
          mmRef.current?.destroy?.()
        } catch (err) {
          // 清理失败静默
        }
      }
    } catch (err) {
      console.error('MindmapThumbnail 故障:', err)
      if (mounted) {
        setHasError(true)
        setIsLoading(false)
      }
      return () => { mounted = false }
    }
  }, [content])

  // 加载状态
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500">生成预览中...</span>
        </div>
      </div>
    )
  }

  // 空内容状态
  if (!content || content.trim() === '') {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
        <div className="flex flex-col items-center space-y-2 text-gray-400">
          <FileText className="w-8 h-8" />
          <span className="text-xs">暂无内容</span>
        </div>
      </div>
    )
  }

  // 错误状态 - 显示简单的文本预览作为回退
  if (hasError) {
    const lines = content.split('\n').filter(line => line.trim()).slice(0, 6)
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-3 ${className}`}>
        <div className="text-xs text-gray-600 space-y-1">
          {lines.map((line, index) => (
            <div 
              key={index} 
              className="truncate"
              style={{ 
                marginLeft: `${(line.match(/^#+/) || [''])[0].length * 8}px`,
                fontWeight: line.startsWith('#') ? 'bold' : 'normal'
              }}
            >
              {line.replace(/^#+\s*/, '')}
            </div>
          ))}
          {content.split('\n').length > 6 && (
            <div className="text-gray-400 text-center">...</div>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <AlertCircle className="w-4 h-4 text-orange-400" />
        </div>
      </div>
    )
  }

  // 正常显示缩略图
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}
      />
      {/* 渐变遮罩，增强视觉效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none"></div>
    </div>
  )
}

export default MindmapThumbnail
export default MindmapThumbnail