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

  // 控制节点展开深度的函数
  const setNodeDepth = (node, maxDepth, currentDepth = 0) => {
    if (!node) return
    
    console.log(`🔧 DEBUG: 处理节点，深度${currentDepth}，最大深度${maxDepth}，节点内容:`, node.content || node.value || '未知')
    
    // 设置节点的展开状态 - 使用正确的markmap API
    if (currentDepth >= maxDepth) {
      if (!node.data) node.data = {}
      node.data.fold = true
      console.log(`🔧 DEBUG: 折叠节点(深度${currentDepth})，设置fold=true`)
    } else {
      if (node.data) {
        delete node.data.fold
        console.log(`🔧 DEBUG: 展开节点(深度${currentDepth})，删除fold属性`)
      }
    }
    
    // 递归处理子节点
    if (node.children) {
      console.log(`🔧 DEBUG: 节点有${node.children.length}个子节点，递归处理`)
      node.children.forEach(child => {
        setNodeDepth(child, maxDepth, currentDepth + 1)
      })
    }
  }

  // 展开折叠控制函数
  const toggleMarkmapFold = (shouldCollapse) => {
    console.log('🔧 DEBUG: toggleMarkmapFold被调用，shouldCollapse:', shouldCollapse)
    
    if (!mmRef.current || !rootDataRef.current) {
      console.error('🔧 DEBUG: 缺少必要的引用')
      console.log('🔧 DEBUG: mmRef.current:', !!mmRef.current)
      console.log('🔧 DEBUG: rootDataRef.current:', !!rootDataRef.current)
      return
    }
    
    try {
      console.log('🔧 DEBUG: 原始数据结构:', rootDataRef.current)
      
      // 创建数据副本避免修改原始数据
      const dataCopy = JSON.parse(JSON.stringify(rootDataRef.current))
      console.log('🔧 DEBUG: 数据副本创建成功')
      
      if (shouldCollapse) {
        console.log('🔧 DEBUG: 开始折叠操作，深度限制为2')
        // 折叠到二级目录 - 深度为2
        setNodeDepth(dataCopy, 2)
      } else {
        console.log('🔧 DEBUG: 开始展开操作，移除所有fold属性')
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
      }
      
      console.log('🔧 DEBUG: 处理后的数据结构:', dataCopy)
      console.log('🔧 DEBUG: 调用markmap的setData方法')
      
      // 重新渲染并适应视图
      mmRef.current.setData(dataCopy)
      
      console.log('🔧 DEBUG: setData调用成功，等待fit')
      
      setTimeout(() => {
        if (mmRef.current) {
          console.log('🔧 DEBUG: 执行fit操作')
          mmRef.current.fit()
        }
      }, 300)
      
    } catch (error) {
      console.error('🔧 DEBUG: 展开/折叠操作失败:', error)
      console.error('🔧 DEBUG: 错误详情:', error.stack)
    }
  }

  // 展开/折叠切换函数
  const handleToggleExpandCollapse = () => {
    console.log('🔧 DEBUG: 折叠展开按钮被点击')
    console.log('🔧 DEBUG: mmRef.current存在:', !!mmRef.current)
    console.log('🔧 DEBUG: rootDataRef.current存在:', !!rootDataRef.current)
    console.log('🔧 DEBUG: 当前展开状态:', isExpanded)
    
    if (!mmRef.current) {
      console.error('🔧 DEBUG: mmRef.current不存在，无法执行折叠操作')
      return
    }

    try {
      const newExpandedState = !isExpanded
      const shouldCollapse = !newExpandedState
      
      console.log('🔧 DEBUG: 新的展开状态:', newExpandedState)
      console.log('🔧 DEBUG: 应该折叠:', shouldCollapse)
      
      // 执行展开/折叠操作
      toggleMarkmapFold(shouldCollapse)
      
      // 更新UI状态
      setIsExpanded(newExpandedState)
      console.log('🔧 DEBUG: UI状态已更新为:', newExpandedState)
      
    } catch (error) {
      console.error('🔧 DEBUG: 展开/折叠操作失败:', error)
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
        
        console.log('🔧 DEBUG: markmap实例创建成功')
        console.log('🔧 DEBUG: markmap实例方法:', Object.getOwnPropertyNames(mmRef.current))
        console.log('🔧 DEBUG: markmap实例原型方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(mmRef.current)))
        
        // 设置数据
        mmRef.current.setData(root)
        console.log('🔧 DEBUG: 初始数据设置成功')
        
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
          title={isExpanded ? '点击折叠到二级目录' : '点击展开所有节点'}
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