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

  // 添加调试用的渲染计数器和原因追踪
  const renderCountRef = useRef(0)
  const prevMindmapDataRef = useRef(null)
  renderCountRef.current++

  // 详细分析重新渲染的原因
  const mindmapDataChanged = mindmapData !== prevMindmapDataRef.current
  const mindmapDataContentChanged = mindmapData?.markdown !== prevMindmapDataRef.current?.markdown

  console.log(`🔍 [SimpleMarkmapBasic] 组件渲染 #${renderCountRef.current}`, {
    isProcessing: isProcessingRef.current,
    hasMindmapData: !!mindmapData?.markdown,
    mindmapDataLength: mindmapData?.markdown?.length || 0,
    mindmapDataChanged,
    mindmapDataContentChanged,
    mindmapDataReference: mindmapData === prevMindmapDataRef.current ? 'SAME_REF' : 'DIFF_REF',
    timestamp: new Date().toISOString()
  })

  // 更新引用
  prevMindmapDataRef.current = mindmapData

  // 暴露 markmap 实例给父组件
  useImperativeHandle(ref, () => ({
    getMarkmapInstance: () => {
      console.log(`🔍 [getMarkmapInstance] 被调用, isProcessing: ${isProcessingRef.current}, timestamp: ${new Date().toISOString()}`)
      return mmRef.current
    },
    getSVGElement: () => {
      console.log(`🔍 [getSVGElement] 被调用, isProcessing: ${isProcessingRef.current}, timestamp: ${new Date().toISOString()}`)
      return svgRef.current
    },
    fit: () => {
      console.log(`🔍 [fit] 被调用, isProcessing: ${isProcessingRef.current}, timestamp: ${new Date().toISOString()}`)
      return mmRef.current?.fit()
    },
    setProcessing: (processing) => {
      console.log(`🔍 [setProcessing] 被调用: ${processing}, 之前状态: ${isProcessingRef.current}, timestamp: ${new Date().toISOString()}`)
      isProcessingRef.current = processing
    },
  }))

  // 自适应窗口大小的函数（优化版，避免导出时重新渲染）
  const handleResize = () => {
    console.log(`🔍 [handleResize] 被调用, isProcessing: ${isProcessingRef.current}, timestamp: ${new Date().toISOString()}`)
    
    // 如果正在处理（如导出），跳过resize操作
    if (isProcessingRef.current) {
      console.log('🔍 [handleResize] 跳过resize - 正在处理中')
      return
    }

    if (mmRef.current && containerRef.current) {
      console.log(`🔍 [handleResize] 执行resize操作`)
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
          console.log(`🔍 [handleResize] 延迟执行fit(), timestamp: ${new Date().toISOString()}`)
          mmRef.current.fit()
        } else {
          console.log(`🔍 [handleResize] 延迟执行时跳过fit() - 正在处理中`)
        }
      }, 100)
    }
  }

  useEffect(() => {
    console.log(`🔍 [useEffect] 开始执行, 依赖变化:`, {
      isProcessing: isProcessingRef.current,
      hasMindmapData: !!mindmapData?.markdown,
      mindmapDataLength: mindmapData?.markdown?.length || 0,
      mindmapDataChanged,
      mindmapDataContentChanged,
      timestamp: new Date().toISOString()
    })

    const initMarkmap = async () => {
      console.log(`🔍 [initMarkmap] 开始初始化检查, timestamp: ${new Date().toISOString()}`)
      
      // 如果正在处理中，跳过初始化
      if (isProcessingRef.current) {
        console.log('🔍 [initMarkmap] 跳过初始化 - 正在处理中')
        return
      }
      
      if (!mindmapData?.markdown || !svgRef.current || !containerRef.current) {
        console.log('🔍 [initMarkmap] 跳过初始化 - 缺少必要数据或DOM元素', {
          hasMarkdown: !!mindmapData?.markdown,
          hasSvgRef: !!svgRef.current,
          hasContainerRef: !!containerRef.current
        })
        return
      }

      try {
        console.log('🔍 [initMarkmap] 开始真正的初始化过程')
        
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
        console.log('🔍 [initMarkmap] 开始导入markmap库')
        const { Transformer } = await import('markmap-lib')
        const { Markmap } = await import('markmap-view')
        
        // 创建transformer并转换数据
        console.log('🔍 [initMarkmap] 开始转换数据')
        const transformer = new Transformer()
        const { root } = transformer.transform(mindmapData.markdown)
        
        if (!root) {
          throw new Error('思维导图数据转换失败')
        }

        // 获取容器尺寸
        const containerRect = containerRef.current.getBoundingClientRect()
        const width = Math.max(containerRect.width, 400)
        const height = Math.max(containerRect.height, 300)

        console.log('🔍 [initMarkmap] 容器尺寸:', { width, height })

        // 重新清空SVG（移除加载提示）
        svgRef.current.innerHTML = ''
        
        // 设置SVG尺寸
        svgRef.current.setAttribute('width', width)
        svgRef.current.setAttribute('height', height)

        // 创建markmap实例
        console.log('🔍 [initMarkmap] 创建markmap实例')
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
        console.log('🔍 [initMarkmap] 设置思维导图数据')
        mmRef.current.setData(root)
        console.log('🔍 [initMarkmap] ✅ 思维导图渲染成功, timestamp:', new Date().toISOString())
        
        // 延迟执行fit以确保渲染完成（但要检查是否在处理中）
        setTimeout(() => {
          if (mmRef.current && !isProcessingRef.current) {
            console.log('🔍 [initMarkmap] 延迟执行初始fit()', new Date().toISOString())
            mmRef.current.fit()
          } else {
            console.log('🔍 [initMarkmap] 延迟执行时跳过初始fit() - 正在处理中')
          }
        }, 300)

      } catch (error) {
        console.error('🔍 [initMarkmap] ❌ 渲染失败:', error)
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
    console.log('🔍 [useEffect] 设置延迟初始化定时器')
    const timer = setTimeout(initMarkmap, 100)

    // 添加窗口大小变化监听（优化版）
    console.log('🔍 [useEffect] 添加resize监听器')
    window.addEventListener('resize', handleResize)
    
    // 使用ResizeObserver监听容器尺寸变化（优化版）
    let resizeObserver
    if (containerRef.current && window.ResizeObserver) {
      console.log('🔍 [useEffect] 创建ResizeObserver')
      resizeObserver = new ResizeObserver(() => {
        console.log('🔍 [ResizeObserver] 触发, timestamp:', new Date().toISOString())
        // 防抖处理，避免频繁调用
        if (!isProcessingRef.current) {
          handleResize()
        } else {
          console.log('🔍 [ResizeObserver] 跳过 - 正在处理中')
        }
      })
      resizeObserver.observe(containerRef.current)
    }
    
    // 清理函数
    return () => {
      console.log('🔍 [useEffect] 清理函数执行, timestamp:', new Date().toISOString())
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
  }, [mindmapData]) // 🎯 只依赖mindmapData！

  console.log(`🔍 [SimpleMarkmapBasic] 组件渲染完成 #${renderCountRef.current}, timestamp: ${new Date().toISOString()}`)

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
      
      {/* 控制按钮组 */}
      <div className="absolute top-2 right-2 flex space-x-2">
        {/* 使用提示按钮 */}
        <button
          onClick={() => {
            alert('💡 使用提示：\n\n• 点击任意节点可以折叠/展开该分支\n• 拖拽可以移动视图\n• 滚轮可以缩放\n• 点击"适应"可以重置视图')
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm shadow-md transition-colors"
          title="使用提示"
        >
          💡 提示
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
    </div>
  )
})

SimpleMarkmapBasic.displayName = 'SimpleMarkmapBasic'

export default SimpleMarkmapBasic