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
  const isToggleOperationRef = useRef(false) // 防止重复的折叠展开操作
  const fitTimeoutRef = useRef(null) // fit操作防抖
  
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

  // 展开折叠控制函数
  const toggleMarkmapFold = (shouldCollapse) => {
    // 防止重复操作
    if (isToggleOperationRef.current) {
      return
    }
    
    if (!mmRef.current) {
      return
    }
    
    // 设置操作锁
    isToggleOperationRef.current = true
    
    try {
      // 获取当前的数据树
      const currentData = mmRef.current.state?.data
      if (!currentData) {
        return
      }
      
      let processedNodeCount = 0
      
      // 递归处理节点
      const processNode = (node, depth = 0) => {
        if (!node) return
        
        processedNodeCount++
        
        if (shouldCollapse && depth >= 1 && node.children && node.children.length > 0) {
          // 在深度为1及以上的节点上设置折叠，这样它们的子节点就会被隐藏
          // 效果就是只保留根节点(depth=0)和一级节点(depth=1)可见
          node.fold = 1
          node.folded = true
          if (!node.payload) node.payload = {}
          node.payload.fold = 1
        } else if (!shouldCollapse) {
          // 展开节点 - 清除所有fold属性
          delete node.fold
          delete node.folded
          if (node.payload) {
            delete node.payload.fold
            delete node.payload.folded
          }
        }
        
        // 递归处理子节点
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(child => processNode(child, depth + 1))
        }
      }
      
      processNode(currentData)
      
      // 检查容器尺寸，避免 NaN 问题
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const hasValidDimensions = containerRect.width > 0 && containerRect.height > 0
        
        if (!hasValidDimensions) {
          // 重新渲染但不执行 fit
          mmRef.current.setData(currentData)
          return
        }
      }
      
      // 重新渲染
      mmRef.current.setData(currentData)
      
      // 延迟执行 fit，确保渲染完成
      setTimeout(() => {
        if (mmRef.current && containerRef.current) {
          try {
            // 再次检查容器尺寸
            const containerRect = containerRef.current.getBoundingClientRect()
            if (containerRect.width > 0 && containerRect.height > 0) {
              // 验证markmap状态
              const markmapState = mmRef.current.state
              if (markmapState && markmapState.data) {
                // 检查SVG元素状态
                const svg = svgRef.current
                if (svg && svg.children.length > 0) {
                  mmRef.current.fit()
                }
              }
            }
          } catch (fitError) {
            // fit 操作失败，静默处理
          } finally {
            // 释放操作锁
            isToggleOperationRef.current = false
          }
        } else {
          // 如果条件不满足也要释放锁
          isToggleOperationRef.current = false
        }
      }, 500) // 增加延迟时间确保渲染完成
      
    } catch (error) {
      // 异常情况下也要释放锁
      isToggleOperationRef.current = false
    }
  }

  // 展开/折叠切换函数
  const handleToggleExpandCollapse = () => {
    if (!mmRef.current) return

    try {
      const newExpandedState = !isExpanded
      const shouldCollapse = !newExpandedState
      
      // 执行展开/折叠操作
      toggleMarkmapFold(shouldCollapse)
      
      // 更新UI状态
      setIsExpanded(newExpandedState)
      
    } catch (error) {
      // 展开/折叠操作失败，静默处理
    }
  }

  // 自适应窗口大小的函数
  const handleResize = () => {
    // 如果正在处理（如导出），跳过resize操作
    if (isProcessingRef.current || isToggleOperationRef.current) {
      return
    }
    
    // 清除之前的timeout，实现防抖
    if (fitTimeoutRef.current) {
      clearTimeout(fitTimeoutRef.current)
    }

    if (mmRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const width = Math.max(containerRect.width, 400)
      const height = Math.max(containerRect.height, 300)
      
      // 检查尺寸是否有效
      if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
        return
      }
      
      // 更新SVG尺寸
      if (svgRef.current) {
        svgRef.current.setAttribute('width', width)
        svgRef.current.setAttribute('height', height)
      }
      
      // 延迟执行以确保容器大小已更新，使用防抖
      fitTimeoutRef.current = setTimeout(() => {
        // 再次检查是否仍在处理中
        if (mmRef.current && !isProcessingRef.current && !isToggleOperationRef.current && containerRef.current) {
          try {
            // 最后一次检查容器尺寸
            const finalRect = containerRef.current.getBoundingClientRect()
            if (finalRect.width > 0 && finalRect.height > 0) {
              // 验证markmap状态
              const markmapState = mmRef.current.state
              if (markmapState && markmapState.data) {
                // 检查SVG元素状态
                const svg = svgRef.current
                if (svg && svg.children.length > 0) {
                  mmRef.current.fit()
                }
              }
            }
          } catch (fitError) {
            // resize 中的 fit 操作失败，静默处理
          }
        }
        fitTimeoutRef.current = null // 清除引用
      }, 250) // 增加防抖延迟时间
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

      // 在生产环境中静默控制台日志
      const originalConsole = {}
      if (process.env.NODE_ENV === 'production') {
        originalConsole.log = console.log
        originalConsole.info = console.info
        originalConsole.debug = console.debug
        console.log = () => {}
        console.info = () => {}
        console.debug = () => {}
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

        // 恢复控制台日志
        if (process.env.NODE_ENV === 'production') {
          console.log = originalConsole.log
          console.info = originalConsole.info
          console.debug = originalConsole.debug
        }

      } catch (error) {
        // 恢复控制台日志（错误情况）
        if (process.env.NODE_ENV === 'production' && originalConsole.log) {
          console.log = originalConsole.log
          console.info = originalConsole.info
          console.debug = originalConsole.debug
        }
        
        // 思维导图渲染失败，显示错误信息
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
      if (fitTimeoutRef.current) {
        clearTimeout(fitTimeoutRef.current)
        fitTimeoutRef.current = null
      }
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (mmRef.current) {
        mmRef.current.destroy?.()
        mmRef.current = null
      }
      // 重置状态锁
      isToggleOperationRef.current = false
      isProcessingRef.current = false
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
          onClick={() => {
            if (mmRef.current && containerRef.current) {
              try {
                // 验证容器尺寸
                const containerRect = containerRef.current.getBoundingClientRect()
                if (containerRect.width > 0 && containerRect.height > 0) {
                  // 验证markmap状态
                  const markmapState = mmRef.current.state
                  if (markmapState && markmapState.data) {
                    // 检查SVG元素状态
                    const svg = svgRef.current
                    if (svg && svg.children.length > 0) {
                      mmRef.current.fit()
                    }
                  }
                }
              } catch (error) {
                // 手动适应操作失败，静默处理
              }
            }
          }}
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