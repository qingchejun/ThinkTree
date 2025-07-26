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
      if (currentDepth <= 3) { // 只记录前几层的日志，避免过多输出
        console.log('🔧 折叠节点(深度' + currentDepth + '):', node.content || node.value || '未知')
      }
    } else {
      if (node.data) {
        delete node.data.fold
      }
      if (currentDepth <= 3) {
        console.log('🔧 展开节点(深度' + currentDepth + '):', node.content || node.value || '未知')
      }
    }
    
    // 递归处理子节点
    if (node.children) {
      node.children.forEach(child => {
        setNodeDepth(child, maxDepth, currentDepth + 1)
      })
    }
  }

  // 展开/折叠切换函数 - 使用新的方法
  const toggleExpandCollapse = () => {
    console.log('🔧 展开/折叠按钮被点击，当前状态:', isExpanded)
    
    if (!mmRef.current || !rootDataRef.current) {
      console.error('🔧 缺少必要引用: mmRef=', !!mmRef.current, 'rootDataRef=', !!rootDataRef.current)
      return
    }
    
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)
    
    try {
      // 方法1: 尝试使用markmap的rescale方法
      if (mmRef.current.rescale) {
        console.log('🔧 尝试方法1: 使用rescale')
        mmRef.current.rescale(newExpandedState ? 1 : 0.5)
        return
      }
      
      // 方法2: 尝试直接操作DOM节点
      const svg = svgRef.current
      if (svg) {
        console.log('🔧 尝试方法2: 直接操作DOM')
        const nodes = svg.querySelectorAll('g[data-depth]')
        nodes.forEach(node => {
          const depth = parseInt(node.getAttribute('data-depth') || '0')
          if (!newExpandedState && depth >= 2) {
            node.style.display = 'none'
          } else {
            node.style.display = ''
          }
        })
        return
      }
      
      // 方法3: 尝试使用d3选择器操作
      console.log('🔧 尝试方法3: 使用d3操作')
      const d3 = window.d3 || mmRef.current.d3
      if (d3) {
        const svgElement = d3.select(svgRef.current)
        const allNodes = svgElement.selectAll('g.markmap-node')
        console.log('🔧 找到节点数量:', allNodes.size())
        
        allNodes.each(function(d, i) {
          const node = d3.select(this)
          const depth = d.depth || 0
          console.log('🔧 处理节点深度:', depth)
          if (!newExpandedState && depth >= 2) {
            node.style('opacity', '0.3')
            node.selectAll('g').style('opacity', '0.1')
          } else {
            node.style('opacity', '1')
            node.selectAll('g').style('opacity', '1')
          }
        })
        return
      }
      
      // 方法4: 传统的fold方法
      console.log('🔧 回退到方法4: 传统fold方法')
      const dataCopy = JSON.parse(JSON.stringify(rootDataRef.current))
      
      if (newExpandedState) {
        console.log('🔧 展开所有节点')
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
        console.log('🔧 折叠到二级目录')
        setNodeDepth(dataCopy, 2)
      }
      
      console.log('🔧 更新markmap数据')
      mmRef.current.setData(dataCopy)
      
      setTimeout(() => {
        if (mmRef.current) {
          console.log('🔧 执行fit操作')
          mmRef.current.fit()
        }
      }, 300)
      
    } catch (error) {
      console.error('🔧 所有方法都失败了:', error)
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
        
        console.log('🔧 markmap实例创建成功')
        console.log('🔧 markmap实例方法:', Object.getOwnPropertyNames(mmRef.current))
        console.log('🔧 markmap实例原型方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(mmRef.current)))
        console.log('🔧 markmap完整实例:', mmRef.current)
        
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