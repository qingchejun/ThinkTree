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

  // 递归设置节点的折叠状态
  const setNodeFoldState = (node, shouldFold, currentDepth = 0) => {
    if (!node) {
      console.log(`🔍 [DEBUG] setNodeFoldState: 节点为空，深度${currentDepth}`)
      return
    }
    
    console.log(`🔍 [DEBUG] setNodeFoldState: 处理节点，深度${currentDepth}，shouldFold=${shouldFold}`)
    console.log(`🔍 [DEBUG] 节点内容:`, node.content || node.value || '无内容')
    console.log(`🔍 [DEBUG] 节点有children:`, !!node.children, node.children?.length || 0)
    
    // 对于第二级及以下的节点进行折叠控制
    if (currentDepth >= 1) {
      if (shouldFold) {
        // 折叠模式：第二级节点保持展开，第三级及以下折叠
        if (currentDepth > 1) {
          console.log(`🔍 [DEBUG] 设置节点折叠，深度${currentDepth}`)
          node.fold = 1 // markmap使用fold属性控制折叠
        } else {
          console.log(`🔍 [DEBUG] 保持节点展开，深度${currentDepth}`)
          delete node.fold // 确保第二级节点不被折叠
        }
      } else {
        // 展开模式：移除所有fold属性
        console.log(`🔍 [DEBUG] 移除节点fold属性，深度${currentDepth}`)
        delete node.fold
      }
    }
    
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      console.log(`🔍 [DEBUG] 递归处理${node.children.length}个子节点`)
      node.children.forEach((child, index) => {
        console.log(`🔍 [DEBUG] 处理第${index + 1}个子节点`)
        setNodeFoldState(child, shouldFold, currentDepth + 1)
      })
    }
  }

  // 展开/折叠切换函数
  const handleToggleExpandCollapse = () => {
    console.log('🔄 [DEBUG] 按钮被点击了！')
    console.log('🔄 [DEBUG] 当前展开状态:', isExpanded)
    console.log('🔄 [DEBUG] mmRef.current存在?', !!mmRef.current)
    console.log('🔄 [DEBUG] rootDataRef.current存在?', !!rootDataRef.current)
    
    if (!mmRef.current) {
      console.warn('❌ [ERROR] Markmap实例未就绪')
      return
    }
    
    if (!rootDataRef.current) {
      console.warn('❌ [ERROR] 思维导图数据未就绪')
      return
    }

    try {
      const newExpandedState = !isExpanded
      console.log('🔄 [DEBUG] 即将切换到状态:', newExpandedState ? '展开所有节点' : '折叠到主要分支')
      console.log('🔄 [DEBUG] 原始数据结构:', rootDataRef.current)
      console.log('🔄 [DEBUG] 数据类型:', typeof rootDataRef.current)
      console.log('🔄 [DEBUG] 数据是否有children:', !!rootDataRef.current?.children)
      
      // 创建数据的深拷贝以避免修改原始数据
      const dataClone = JSON.parse(JSON.stringify(rootDataRef.current))
      console.log('🔄 [DEBUG] 数据拷贝完成:', dataClone)
      
      // 设置折叠状态：newExpandedState=true表示要展开，传入false给setNodeFoldState
      console.log('🔄 [DEBUG] 开始调用setNodeFoldState，shouldFold参数:', !newExpandedState)
      setNodeFoldState(dataClone, !newExpandedState)
      
      console.log('🔄 [DEBUG] setNodeFoldState执行完成')
      console.log('🔄 [DEBUG] 处理后的数据结构:', dataClone)
      
      // 更新markmap数据
      console.log('🔄 [DEBUG] 开始调用mmRef.current.setData')
      mmRef.current.setData(dataClone)
      console.log('🔄 [DEBUG] setData调用完成')
      
      // 更新状态
      console.log('🔄 [DEBUG] 更新React状态:', newExpandedState)
      setIsExpanded(newExpandedState)
      
      // 延迟执行fit以确保渲染完成
      setTimeout(() => {
        console.log('🔄 [DEBUG] 延迟fit执行')
        if (mmRef.current && !isProcessingRef.current) {
          mmRef.current.fit()
          console.log('🔄 [DEBUG] fit调用完成')
        }
      }, 300)
      
      console.log('✅ [SUCCESS] 展开/折叠操作完成')
      
    } catch (error) {
      console.error('❌ [ERROR] 展开/折叠操作失败:', error)
      console.error('❌ [ERROR] 错误详情:', error.stack)
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
        console.log('💾 [DEBUG] 保存原始数据到rootDataRef:', root)
        console.log('💾 [DEBUG] 数据结构类型:', typeof root)
        console.log('💾 [DEBUG] 数据是否有children:', !!root?.children, root?.children?.length || 0)
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
            console.log('🖱️ [DEBUG] 按钮onClick事件触发')
            console.log('🖱️ [DEBUG] 事件对象:', e)
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