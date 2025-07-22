/**
 * Markmap 思维导图组件
 */
'use client'

import { useEffect, useRef } from 'react'
import '../../styles/markmap.css'

export default function MarkmapView({ mindmapData }) {
  const svgRef = useRef(null)
  const mmRef = useRef(null)

  useEffect(() => {
    // 动态导入 markmap 库（仅在客户端）
    const initMarkmap = async () => {
      try {
        const { Markmap } = await import('markmap-view')
        const { Transformer } = await import('markmap-lib')
        
        if (!mindmapData || !mindmapData.markdown) {
          return
        }

        // 创建 transformer 实例
        const transformer = new Transformer()
        
        // 转换 Markdown 为 markmap 数据
        console.log('Markdown data:', mindmapData.markdown)
        const { root } = transformer.transform(mindmapData.markdown)
        console.log('Transformed root:', root)
        
        // 清理之前的实例
        if (mmRef.current) {
          mmRef.current.destroy?.()
          mmRef.current = null
        }
        
        // 清空SVG内容
        if (svgRef.current) {
          svgRef.current.innerHTML = ''
        }

        // 创建新的 markmap 实例
        if (svgRef.current) {
          const options = {
            color: (d) => {
              const colors = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
              return colors[d.depth % colors.length]
            },
            paddingX: 8,
            spacingHorizontal: 80,
            spacingVertical: 20,
          }
          
          mmRef.current = Markmap.create(svgRef.current, options)
          
          // 渲染思维导图
          mmRef.current.setData(root)
          mmRef.current.fit()
        }

      } catch (error) {
        console.error('Markmap 初始化失败:', error)
      }
    }

    initMarkmap()
    
    // 清理函数
    return () => {
      if (mmRef.current) {
        mmRef.current.destroy?.()
        mmRef.current = null
      }
    }
  }, [mindmapData])

  if (!mindmapData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">🌳</div>
          <p>暂无思维导图数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-white">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: 'move' }}
      />
    </div>
  )
}