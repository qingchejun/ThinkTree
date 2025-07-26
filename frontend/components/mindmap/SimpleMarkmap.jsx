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
  // 控制按钮显示的状态
  const [showButtons, setShowButtons] = useState(false)

  // 控制节点展开深度的函数
  const setNodeDepth = (node, maxDepth, currentDepth = 0) => {
    if (!node) return
    
    // 设置节点的展开状态
    if (currentDepth >= maxDepth) {
      if (!node.data) node.data = {}
      node.data.fold = true
    } else {
      if (node.data) {
        delete node.data.fold
      }
    }
    
    // 递归处理子节点
    if (node.children) {
      node.children.forEach(child => {
        setNodeDepth(child, maxDepth, currentDepth + 1)
      })
    }
  }

  // 展开/折叠切换函数 - 使用markmap原生API
  const toggleExpandCollapse = () => {
    if (!mmRef.current) return
    
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)
    
    try {
      // 获取SVG中的所有节点
      const svg = svgRef.current
      if (!svg) return
      
      // 直接回退到数据方法 - DOM操作方式有问题
      console.log('使用数据方法进行折叠展开')
      throw new Error('跳过DOM操作，使用数据方法')
      
      // 重新适应视图
      setTimeout(() => {
        if (mmRef.current) {
          mmRef.current.fit()
        }
      }, 100)
      
    } catch (error) {
      console.error('折叠展开失败:', error)
      
      // 使用正确的markmap fold机制
      if (rootDataRef.current) {
        console.log('开始数据方法折叠展开，目标状态:', newExpandedState ? '展开' : '折叠')
        const dataCopy = JSON.parse(JSON.stringify(rootDataRef.current))
        
        const processNodeForFold = (node, depth = 0) => {
          if (!node) return
          
          console.log(`处理节点深度${depth}:`, node.content || node.value || '根节点')
          
          if (newExpandedState) {
            // 展开所有节点 - 移除fold状态
            if (node.state) {
              delete node.state.fold
            }
            if (node.payload) {
              delete node.payload.fold  
            }
            delete node.fold
          } else {
            // 折叠深度>=2的节点
            if (depth >= 2) {
              // 尝试多种fold设置方式
              if (!node.state) node.state = {}
              node.state.fold = 1
              
              if (!node.payload) node.payload = {}
              node.payload.fold = 1
              
              node.fold = 1
              console.log(`折叠节点深度${depth}`)
            }
          }
          
          // 递归处理子节点
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => processNodeForFold(child, depth + 1))
          }
        }
        
        processNodeForFold(dataCopy)
        
        console.log('处理后的数据:', dataCopy)
        console.log('调用setData更新思维导图')
        
        mmRef.current.setData(dataCopy)
        
        // 尝试调用markmap的rescale方法
        setTimeout(() => {
          if (mmRef.current) {
            if (mmRef.current.rescale) {
              console.log('调用rescale方法')
              mmRef.current.rescale()
            }
            console.log('调用fit方法')
            mmRef.current.fit()
          }
        }, 300)
      }
    }
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
      if (!mindmapData?.markdown || !svgRef.current || !containerRef.current) {
        console.log('SimpleMarkmap: 缺少必要数据或DOM元素')
        return
      }

      try {
        console.log('SimpleMarkmap: 开始初始化，数据:', mindmapData.markdown.substring(0, 100) + '...')
        
        // 清空SVG
        svgRef.current.innerHTML = ''
        
        // 显示加载状态
        svgRef.current.innerHTML = `
          <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-size="12">
            正在渲染思维导图...
          </text>
        `

        // 动态导入 - 增加重试机制
        let Markmap, Transformer
        let retryCount = 3
        while (retryCount > 0) {
          try {
            const [markmapView, markmapLib] = await Promise.all([
              import('markmap-view'),
              import('markmap-lib')
            ])
            Markmap = markmapView.Markmap
            Transformer = markmapLib.Transformer
            console.log('SimpleMarkmap: markmap库加载成功')
            break
          } catch (importError) {
            retryCount--
            console.warn(`SimpleMarkmap: markmap库导入失败，剩余重试次数: ${retryCount}`, importError)
            if (retryCount === 0) {
              throw new Error('思维导图库加载失败，请刷新页面重试')
            }
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        // 数据验证
        if (!mindmapData.markdown || typeof mindmapData.markdown !== 'string') {
          throw new Error('思维导图数据格式错误')
        }

        // 创建transformer并转换数据
        const transformer = new Transformer()
        const { root } = transformer.transform(mindmapData.markdown)
        
        if (!root) {
          throw new Error('思维导图数据转换失败')
        }
        
        // 保存原始数据的引用
        rootDataRef.current = root
        console.log('SimpleMarkmap: 数据转换成功')

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
        
        
        // 设置初始数据（默认全展开）
        mmRef.current.setData(root)
        console.log('SimpleMarkmap: 思维导图渲染成功')
        
        // 显示控制按钮
        setShowButtons(true)
        
        // 延迟执行fit以确保渲染完成
        setTimeout(() => {
          if (mmRef.current) {
            mmRef.current.fit()
          }
        }, 300)

      } catch (error) {
        console.error('SimpleMarkmap 渲染失败:', error)
        // 隐藏控制按钮
        setShowButtons(false)
        // 显示详细错误信息
        if (svgRef.current) {
          svgRef.current.innerHTML = `
            <g>
              <text x="50%" y="45%" text-anchor="middle" fill="#ef4444" font-size="16" font-weight="bold">
                思维导图渲染失败
              </text>
              <text x="50%" y="55%" text-anchor="middle" fill="#6b7280" font-size="12">
                ${error.message || '未知错误'}
              </text>
              <text x="50%" y="65%" text-anchor="middle" fill="#9ca3af" font-size="10">
                请刷新页面重试或联系技术支持
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
        handleResize()
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
      setShowButtons(false)
    }
  }, [mindmapData])

  // 当数据变化时重置展开状态和按钮显示
  useEffect(() => {
    setIsExpanded(true)
    setShowButtons(false)
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
      {showButtons && (
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