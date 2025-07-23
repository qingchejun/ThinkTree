/**
 * 简化版 Markmap 组件 - 支持展开/折叠功能
 */
'use client'

import { useEffect, useRef, useState } from 'react'

export default function SimpleMarkmap({ mindmapData }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const mmRef = useRef(null)
  const rootDataRef = useRef(null)
  
  // 展开/折叠状态：true为全展开，false为只显示二级目录
  const [isExpanded, setIsExpanded] = useState(true)

  // 控制节点展开深度的函数
  const setNodeDepth = (node, maxDepth, currentDepth = 0) => {
    if (!node) return
    
    // 设置节点的展开状态
    if (currentDepth >= maxDepth) {
      node.data = { ...node.data, fold: true }
    } else {
      node.data = { ...node.data, fold: false }
    }
    
    // 递归处理子节点
    if (node.children) {
      node.children.forEach(child => {
        setNodeDepth(child, maxDepth, currentDepth + 1)
      })
    }
  }

  // 展开/折叠切换函数
  const toggleExpandCollapse = () => {
    if (!mmRef.current || !rootDataRef.current) return
    
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)
    
    // 创建数据副本避免修改原始数据
    const dataCopy = JSON.parse(JSON.stringify(rootDataRef.current))
    
    if (newExpandedState) {
      // 展开所有节点 - 移除所有fold属性
      const removeFold = (node) => {
        if (node.data) {
          delete node.data.fold
        }
        if (node.children) {
          node.children.forEach(removeFold)
        }
      }
      removeFold(dataCopy)
    } else {
      // 折叠到二级目录 - 深度为2
      setNodeDepth(dataCopy, 2)
    }
    
    // 更新markmap数据
    mmRef.current.setData(dataCopy)
    
    // 延迟执行fit以确保渲染完成
    setTimeout(() => {
      mmRef.current.fit()
    }, 300)
  }

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
        
        // 保存原始数据的引用
        rootDataRef.current = root

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
        
        // 设置初始数据（默认全展开）
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

  // 当数据变化时重置展开状态
  useEffect(() => {
    setIsExpanded(true)
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
      
      {/* 控制按钮组 */}
      {mmRef.current && (
        <div className="absolute top-2 right-2 flex space-x-2">
          {/* 展开/折叠按钮 */}
          <button
            onClick={toggleExpandCollapse}
            className={`${
              isExpanded 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white px-3 py-1 rounded text-sm shadow-md transition-colors`}
            title={isExpanded ? '折叠到二级目录' : '展开所有节点'}
          >
            {isExpanded ? '📄 折叠' : '📖 展开'}
          </button>
          
          {/* 自适应按钮 */}
          <button
            onClick={() => mmRef.current?.fit()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm shadow-md transition-colors"
            title="自适应大小"
          >
            🔍 适应
          </button>
        </div>
      )}
    </div>
  )
}