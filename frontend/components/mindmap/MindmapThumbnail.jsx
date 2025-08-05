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

  useEffect(() => {
    console.log('=== MindmapThumbnail useEffect 开始 ===')
    console.log('MindmapThumbnail - title:', title)
    console.log('MindmapThumbnail - content:', content ? content.substring(0, 100) + '...' : 'null/undefined')
    console.log('MindmapThumbnail - content type:', typeof content)
    console.log('MindmapThumbnail - content length:', content?.length || 0)
    
    // 检查内容是否存在
    if (!content || typeof content !== 'string' || content.trim() === '') {
      console.log('MindmapThumbnail - 内容为空或无效，显示空状态')
      setIsLoading(false)
      setHasError(false)
      return
    }

    console.log('MindmapThumbnail - 内容有效，准备生成缩略图...')
    
    // 延迟执行，确保DOM准备就绪
    setTimeout(() => {
      if (!svgRef.current) {
        console.log('MindmapThumbnail - SVG引用不存在，设置错误状态')
        setHasError(true)
        setIsLoading(false)
        return
      }
      console.log('MindmapThumbnail - SVG引用已准备就绪，开始生成缩略图')
      generateThumbnail()
    }, 100)

    const generateThumbnail = async () => {
      try {
        console.log('MindmapThumbnail - 开始生成缩略图')
        setIsLoading(true)
        setHasError(false)

        // 动态导入markmap库
        console.log('MindmapThumbnail - 正在加载Markmap库...')
        
        const markmapViewModule = await import('markmap-view')
        console.log('MindmapThumbnail - markmap-view模块:', markmapViewModule)
        
        const markmapLibModule = await import('markmap-lib')
        console.log('MindmapThumbnail - markmap-lib模块:', markmapLibModule)
        
        const { Markmap } = markmapViewModule
        const { Transformer } = markmapLibModule
        
        console.log('MindmapThumbnail - Markmap:', Markmap)
        console.log('MindmapThumbnail - Transformer:', Transformer)

        console.log('MindmapThumbnail - Markmap库加载成功')

        // 创建transformer实例
        const transformer = new Transformer()
        
        // 转换markdown内容为markmap数据
        console.log('MindmapThumbnail - 正在转换内容...')
        const { root } = transformer.transform(content)
        
        if (!root) {
          throw new Error('无法解析思维导图内容')
        }

        console.log('MindmapThumbnail - 内容转换成功，节点数:', root.children?.length || 0)

        // 清理之前的内容
        const svg = svgRef.current
        if (!svg) {
          throw new Error('SVG元素不存在')
        }
        
        svg.innerHTML = ''
        
        // 设置SVG尺寸
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')
        svg.setAttribute('viewBox', '0 0 300 200')
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

        // 创建markmap实例（缩略图模式）
        console.log('MindmapThumbnail - 正在创建Markmap实例...')
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

        console.log('MindmapThumbnail - Markmap实例创建成功')

        // 渲染思维导图
        console.log('MindmapThumbnail - 正在渲染数据...')
        mm.setData(root)
        
        // 自动适配视图
        setTimeout(() => {
          try {
            if (mm && typeof mm.fit === 'function') {
              mm.fit()
            }
            setMarkmap(mm)
            setIsLoading(false)
            console.log('MindmapThumbnail - 渲染完成！')
          } catch (error) {
            console.warn('缩略图适配失败:', error)
            setIsLoading(false)
          }
        }, 100)

      } catch (error) {
        console.error('生成思维导图缩略图失败:', error)
        console.error('错误详情:', error.message)
        console.error('错误堆栈:', error.stack)
        setHasError(true)
        setIsLoading(false)
      }
    }

    // 清理函数在useEffect结束时自动执行

    // 清理函数
    return () => {
      console.log('MindmapThumbnail - 清理组件')
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