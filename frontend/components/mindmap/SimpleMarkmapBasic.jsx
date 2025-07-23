/**
 * 基础版 Markmap 组件 - 稳定渲染优先
 */
'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const SimpleMarkmapBasic = forwardRef(({ mindmapData }, ref) => {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const mmRef = useRef(null)
  const isProcessingRef = useRef(false) // 使用useRef避免重新渲染

  // 暴露 markmap 实例给父组件
  useImperativeHandle(ref, () => ({
    getMarkmapInstance: () => mmRef.current,
    getSVGElement: () => svgRef.current,
    fit: () => mmRef.current?.fit(),
    setProcessing: (processing) => {
      isProcessingRef.current = processing
    },
  }))

  // 自适应窗口大小的函数
  const handleResize = () => {
    // 如果正在处理（如导出），跳过resize操作
    if (isProcessingRef.current) {
      return
    }

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
        // 再次检查是否仍在处理中
        if (mmRef.current && !isProcessingRef.current) {
          mmRef.current.fit()
        }
      }, 100)
    }
  }

  useEffect(() => {
    const initMarkmap = async () => {
      // 如果正在处理中，跳过初始化
      if (isProcessingRef.current) {
        return
      }
      
      if (!mindmapData?.markdown || !svgRef.current || !containerRef.current) {
        return
      }

      try {
        // 清空SVG
        svgRef.current.innerHTML = ''
        
        // 显示加载状态
        svgRef.current.innerHTML = `
          <g>
            <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-size="14">
              正在加载思维导图...
            </text>
          </g>
        `

        // 动态导入markmap库
        const { Transformer } = await import('markmap-lib')
        const { Markmap } = await import('markmap-view')
        
        // 创建transformer并转换数据
        const transformer = new Transformer()
        const { root } = transformer.transform(mindmapData.markdown)
        
        if (!root) {
          throw new Error('思维导图数据转换失败')
        }

        // 获取容器尺寸
        const containerRect = containerRef.current.getBoundingClientRect()
        const width = Math.max(containerRect.width, 400)
        const height = Math.max(containerRect.height, 300)

        // 重新清空SVG（移除加载提示）
        svgRef.current.innerHTML = ''
        
        // 设置SVG尺寸
        svgRef.current.setAttribute('width', width)
        svgRef.current.setAttribute('height', height)

        // 创建markmap实例
        mmRef.current = Markmap.create(svgRef.current, {
          spacingVertical: 20,
          spacingHorizontal: 80,
          paddingX: 8,
          autoFit: true,
          pan: true,
          zoom: true,
        })
        
        if (!mmRef.current) {
          throw new Error('思维导图实例创建失败')
        }
        
        // 设置数据
        mmRef.current.setData(root)
        
        // 延迟执行fit以确保渲染完成
        setTimeout(() => {
          if (mmRef.current && !isProcessingRef.current) {
            mmRef.current.fit()
          }
        }, 300)

      } catch (error) {
        console.error('思维导图渲染失败:', error)
        // 显示错误信息
        if (svgRef.current) {
          svgRef.current.innerHTML = `
            <g>
              <text x="50%" y="40%" text-anchor="middle" fill="#ef4444" font-size="16" font-weight="bold">
                思维导图渲染失败
              </text>
              <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-size="12">
                ${error.message || '未知错误'}
              </text>
              <text x="50%" y="60%" text-anchor="middle" fill="#9ca3af" font-size="10">
                请刷新页面重试
              </text>
            </g>
          `
        }
      }
    }

    // 延迟初始化，确保DOM已准备好
    const timer = setTimeout(initMarkmap, 100)

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize)
    
    // 使用ResizeObserver监听容器尺寸变化
    let resizeObserver
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        // 防抖处理，避免频繁调用
        if (!isProcessingRef.current) {
          handleResize()
        }
      })
      resizeObserver.observe(containerRef.current)
    }
    
    // 清理函数
    return () => {
      clearTimeout(timer)
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
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      >
        {/* SVG 内容将由 Markmap 动态生成 */}
      </svg>
    </div>
  )
})

SimpleMarkmapBasic.displayName = 'SimpleMarkmapBasic'

export default SimpleMarkmapBasic