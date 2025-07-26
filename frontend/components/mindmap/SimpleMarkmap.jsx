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
      
      // 尝试多种选择器查找markmap节点
      let allNodes = svg.querySelectorAll('g[data-depth]')
      
      // 如果没有data-depth属性，尝试其他选择器
      if (allNodes.length === 0) {
        allNodes = svg.querySelectorAll('.markmap-node, g.mm-node, g[transform]')
      }
      
      console.log('找到节点数量:', allNodes.length)
      
      if (allNodes.length === 0) {
        console.log('未找到可操作的节点，回退到数据方法')
        throw new Error('无法找到DOM节点')
      }
      
      if (newExpandedState) {
        // 展开模式：显示所有节点
        console.log('展开所有节点')
        allNodes.forEach((node, index) => {
          node.style.display = ''
          node.style.opacity = '1'
          console.log('展开节点', index, node.textContent?.substring(0, 20))
        })
      } else {
        // 折叠模式：隐藏部分节点
        console.log('折叠到关键节点')
        allNodes.forEach((node, index) => {
          // 获取节点深度信息
          const depth = parseInt(node.getAttribute('data-depth') || '0')
          const transform = node.getAttribute('transform') || ''
          
          // 如果有data-depth属性，使用它
          if (node.hasAttribute('data-depth')) {
            if (depth >= 2) {
              node.style.display = 'none'
              console.log('隐藏节点(深度' + depth + ')', node.textContent?.substring(0, 20))
            }
          } else {
            // 否则，隐藏索引大于某个值的节点（简单的层级估算）
            if (index > 5) {  // 前6个节点通常是主要分支
              node.style.display = 'none'
              console.log('隐藏节点(索引' + index + ')', node.textContent?.substring(0, 20))
            }
          }
        })
      }
      
      // 重新适应视图
      setTimeout(() => {
        if (mmRef.current) {
          mmRef.current.fit()
        }
      }, 100)
      
    } catch (error) {
      console.error('折叠展开失败:', error)
      
      // 回退到数据操作方式
      if (rootDataRef.current) {
        const dataCopy = JSON.parse(JSON.stringify(rootDataRef.current))
        
        if (newExpandedState) {
          // 展开所有节点
          const removeFold = (node) => {
            if (node.data) delete node.data.fold
            if (node.children) node.children.forEach(removeFold)
          }
          removeFold(dataCopy)
        } else {
          // 折叠节点
          setNodeDepth(dataCopy, 2)
        }
        
        mmRef.current.setData(dataCopy)
        setTimeout(() => mmRef.current?.fit(), 300)
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