/**
 * 基础版 Markmap 组件 - 稳定渲染优先
 */
'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

const SimpleMarkmapBasic = forwardRef(({ mindmapData }, ref) => {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const mmRef = useRef(null)
  const isProcessingRef = useRef(false) // 使用useRef避免重新渲染
  const rootDataRef = useRef(null) // 保存原始转换后的数据
  
  // 展开/折叠状态管理
  const [isExpanded, setIsExpanded] = useState(true) // 默认全展开

  // 暴露 markmap 实例给父组件
  useImperativeHandle(ref, () => ({
    getMarkmapInstance: () => mmRef.current,
    getSVGElement: () => svgRef.current,
    fit: () => mmRef.current?.fit(),
    setProcessing: (processing) => {
      isProcessingRef.current = processing
    },
  }))

  // 递归设置节点的折叠状态 - 调试版本
  const setNodeFoldState = (node, foldDepth, currentDepth = 0) => {
    if (!node) return
    
    const nodeContent = node.content || node.value || 'unknown'
    console.log(`[折叠调试] 深度${currentDepth}, 阈值${foldDepth}, 节点: ${nodeContent.substring(0, 30)}`)
    
    // 递归处理所有子节点(在设置折叠状态之前)
    if (node.children && node.children.length > 0) {
      console.log(`[折叠调试] 处理 ${node.children.length} 个子节点`)
      node.children.forEach(child => {
        setNodeFoldState(child, foldDepth, currentDepth + 1)
      })
    }
    
    // 如果当前深度大于等于折叠阈值，就折叠这个节点
    // 注意：只有有子节点的节点才需要设置折叠状态
    if (currentDepth >= foldDepth && foldDepth > 0 && node.children && node.children.length > 0) {
      node.fold = 1
      console.log(`[折叠调试] ✂️ 折叠节点: ${nodeContent.substring(0, 30)}`)
    } else {
      // 清除fold属性，确保节点是展开的
      if (node.hasOwnProperty('fold')) {
        delete node.fold
        console.log(`[折叠调试] 📖 展开节点: ${nodeContent.substring(0, 30)}`)
      }
    }
  }

  // 展开/折叠切换函数
  const handleToggleExpandCollapse = () => {
    console.log('🔄 [主调试] 按钮点击，当前状态:', isExpanded)
    console.log('🔄 [主调试] mmRef存在:', !!mmRef.current)
    console.log('🔄 [主调试] rootDataRef存在:', !!rootDataRef.current)
    
    if (!mmRef.current || !rootDataRef.current) {
      console.warn('❌ 思维导图未准备就绪')
      return
    }

    try {
      const newExpandedState = !isExpanded
      console.log('🔄 [主调试] 切换到状态:', newExpandedState ? '展开所有节点' : '折叠到主要分支')
      console.log('🔄 [主调试] 原始数据结构:', rootDataRef.current)
      
      // 创建数据的深拷贝以避免修改原始数据
      const dataClone = JSON.parse(JSON.stringify(rootDataRef.current))
      console.log('🔄 [主调试] 拷贝后数据:', dataClone)
      
      // 设置折叠深度：newExpandedState=true表示要展开(foldDepth=0)，false表示要折叠(foldDepth=2)
      const foldDepth = newExpandedState ? 0 : 2
      console.log('🔄 [主调试] 使用折叠深度:', foldDepth)
      
      setNodeFoldState(dataClone, foldDepth)
      console.log('🔄 [主调试] 处理后数据:', dataClone)
      
      // 更新markmap数据
      console.log('🔄 [主调试] 开始调用setData')
      mmRef.current.setData(dataClone)
      console.log('🔄 [主调试] setData调用完成')
      
      // 更新状态
      setIsExpanded(newExpandedState)
      console.log('🔄 [主调试] UI状态已更新到:', newExpandedState)
      
      // 延迟执行fit以确保渲染完成
      setTimeout(() => {
        if (mmRef.current && !isProcessingRef.current) {
          console.log('🔄 [主调试] 执行fit操作')
          mmRef.current.fit()
        }
      }, 300)
      
      console.log('✅ [主调试] 展开/折叠操作完成')
      
    } catch (error) {
      console.error('❌ [主调试] 展开/折叠操作失败:', error)
      console.error('❌ [主调试] 错误栈:', error.stack)
    }
  }

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

        // 保存原始转换后的数据
        rootDataRef.current = root

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

  // 当数据变化时重置展开状态
  useEffect(() => {
    setIsExpanded(true) // 新数据默认全展开
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
      
      {/* 展开/折叠控制按钮 */}
      <div className="absolute top-2 right-2 flex space-x-2">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleToggleExpandCollapse()
          }}
          className={`${
            isExpanded 
              ? 'bg-orange-500 hover:bg-orange-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white px-3 py-1 rounded text-sm shadow-md transition-colors flex items-center space-x-1`}
          title={isExpanded ? '点击折叠到主要节点' : '点击展开所有节点'}
        >
          <span className="text-base">
            {isExpanded ? '📄' : '📖'}
          </span>
          <span>
            {isExpanded ? '折叠' : '展开'}
          </span>
        </button>
        
        {/* 适应大小按钮 */}
        <button
          onClick={() => mmRef.current?.fit()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm shadow-md transition-colors flex items-center space-x-1"
          title="重新适应窗口大小"
        >
          <span className="text-base">🔍</span>
          <span>适应</span>
        </button>
      </div>
    </div>
  )
})

SimpleMarkmapBasic.displayName = 'SimpleMarkmapBasic'

export default SimpleMarkmapBasic