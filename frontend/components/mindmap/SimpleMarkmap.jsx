/**
 * 简化版 Markmap 组件
 */
'use client'

import { useEffect, useRef } from 'react'

export default function SimpleMarkmap({ mindmapData }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const mmRef = useRef(null)

  // 自适应窗口大小的函数
  const handleResize = () => {
    if (mmRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const width = containerRect.width
      const height = containerRect.height
      
      // 更新SVG尺寸
      if (svgRef.current) {
        svgRef.current.setAttribute('width', width)
        svgRef.current.setAttribute('height', height)
      }
      
      // 延迟执行以确保容器大小已更新
      setTimeout(() => {
        mmRef.current.fit()
      }, 100)
    }
  }

  useEffect(() => {
    const initMarkmap = async () => {
      if (!mindmapData?.markdown || !svgRef.current) return

      try {
        // 动态导入
        const { Markmap } = await import('markmap-view')
        const { Transformer } = await import('markmap-lib')

        // 清空SVG
        svgRef.current.innerHTML = ''

        // 创建transformer并转换数据
        const transformer = new Transformer()
        const { root } = transformer.transform(mindmapData.markdown)

        // 获取容器尺寸
        const containerRect = containerRef.current?.getBoundingClientRect()
        const width = containerRect?.width || 800
        const height = containerRect?.height || 600

        // 设置SVG尺寸
        svgRef.current.setAttribute('width', width)
        svgRef.current.setAttribute('height', height)

        // 创建markmap实例
        mmRef.current = Markmap.create(svgRef.current, {
          // 优化布局参数
          spacingVertical: 20,
          spacingHorizontal: 80,
          paddingX: 8,
          autoFit: true,
          pan: true,
          zoom: true,
        })
        
        mmRef.current.setData(root)
        
        // 延迟执行fit以确保渲染完成
        setTimeout(() => {
          mmRef.current.fit()
        }, 300)

      } catch (error) {
        console.error('Markmap error:', error)
        // 显示错误信息
        if (svgRef.current) {
          svgRef.current.innerHTML = `
            <text x="50%" y="50%" text-anchor="middle" fill="#ef4444" font-size="14">
              思维导图渲染失败
            </text>
          `
        }
      }
    }

    initMarkmap()

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize)
    
    // 使用ResizeObserver监听容器尺寸变化
    let resizeObserver
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(containerRef.current)
    }
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (mmRef.current) {
        mmRef.current.destroy?.()
        mmRef.current = null
      }
    }
  }, [mindmapData])

  return (
    <div 
      ref={containerRef}
      className="h-full w-full bg-white relative"
      style={{ minHeight: '400px' }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ 
          display: 'block',
          cursor: 'grab'
        }}
      />
      
      {/* 自适应按钮 */}
      {mmRef.current && (
        <button
          onClick={() => mmRef.current?.fit()}
          className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm shadow-md transition-colors"
          title="自适应大小"
        >
          🔍 适应
        </button>
      )}
    </div>
  )
}