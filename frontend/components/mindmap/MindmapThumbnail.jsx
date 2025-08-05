'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import { FileText, AlertCircle } from 'lucide-react'

/**
 * 思维导图缩略图组件
 * 用于在Dashboard卡片中显示实际的思维导图预览
 */
const MindmapThumbnail = ({ content, title, className = "" }) => {
  const svgRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [markmap, setMarkmap] = useState(null)

  useEffect(() => {
    if (!content || !svgRef.current) return

    const generateThumbnail = async () => {
      try {
        setIsLoading(true)
        setHasError(false)

        // 创建transformer实例
        const transformer = new Transformer()
        
        // 转换markdown内容为markmap数据
        const { root } = transformer.transform(content)
        
        if (!root) {
          throw new Error('无法解析思维导图内容')
        }

        // 清理之前的内容
        const svg = svgRef.current
        svg.innerHTML = ''
        
        // 设置SVG尺寸
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')
        svg.setAttribute('viewBox', '0 0 300 200')
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

        // 创建markmap实例（缩略图模式）
        const mm = Markmap.create(svg, {
          // 缩略图专用配置
          duration: 0, // 禁用动画以提高性能
          zoom: false, // 禁用缩放
          pan: false, // 禁用拖拽
          maxWidth: 200, // 限制节点最大宽度
          spacingVertical: 8, // 减小垂直间距
          spacingHorizontal: 40, // 减小水平间距
          paddingX: 8, // 减小内边距
          color: (node) => {
            // 简化颜色方案
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
            return colors[node.depth % colors.length]
          },
          // 简化字体设置
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: (node) => Math.max(10, 14 - node.depth * 2), // 更小的字体
        })

        // 渲染思维导图
        mm.setData(root)
        
        // 自动适配视图
        setTimeout(() => {
          try {
            mm.fit()
            setMarkmap(mm)
            setIsLoading(false)
          } catch (error) {
            console.warn('缩略图适配失败:', error)
            setIsLoading(false)
          }
        }, 100)

      } catch (error) {
        console.error('生成思维导图缩略图失败:', error)
        setHasError(true)
        setIsLoading(false)
      }
    }

    generateThumbnail()

    // 清理函数
    return () => {
      if (markmap) {
        try {
          markmap.destroy()
        } catch (error) {
          console.warn('清理markmap实例失败:', error)
        }
      }
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

  // 错误状态
  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
        <div className="flex flex-col items-center space-y-2 text-gray-400">
          <AlertCircle className="w-8 h-8" />
          <span className="text-xs">预览生成失败</span>
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