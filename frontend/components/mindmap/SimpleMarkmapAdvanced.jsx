/**
 * 高级版 Markmap 组件 - 基于稳定基础版本的展开/折叠功能
 */
'use client'

import { useEffect, useRef, useState } from 'react'

export default function SimpleMarkmapAdvanced({ mindmapData }) {
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
    
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        setNodeDepth(child, maxDepth, currentDepth + 1)
      })
      
      // 如果当前深度达到最大深度，则折叠这个节点（隐藏子节点）
      if (currentDepth >= maxDepth - 1) {
        node.fold = true
      } else {
        delete node.fold // 确保不折叠
      }
    } else {
      // 叶子节点不需要fold属性
      delete node.fold
    }
  }

  // 展开/折叠切换函数 - 简化版本，直接操作DOM节点
  const toggleExpandCollapse = () => {
    if (!mmRef.current) {
      console.log('toggleExpandCollapse: 缺少markmap实例')
      return
    }
    
    try {
      const newExpandedState = !isExpanded
      console.log(`toggleExpandCollapse: 切换到${newExpandedState ? '展开' : '折叠'}状态`)
      setIsExpanded(newExpandedState)
      
      // 获取所有一级子节点（depth=1）
      const svg = mmRef.current.svg
      const firstLevelNodes = svg.selectAll('g').filter(function(d) {
        return d && d.depth === 1
      })
      
      console.log('找到一级节点数量:', firstLevelNodes.size())
      
      if (newExpandedState) {
        // 展开：模拟点击已折叠的节点来展开它们
        console.log('展开所有折叠的节点')
        firstLevelNodes.each(function(d) {
          if (d.fold) {
            console.log('展开节点:', d.data?.content)
            // 模拟点击事件来展开节点
            const nodeElement = this
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            })
            nodeElement.dispatchEvent(clickEvent)
          }
        })
      } else {
        // 折叠：模拟点击展开的节点来折叠它们
        console.log('折叠所有展开的节点')
        firstLevelNodes.each(function(d) {
          if (!d.fold && d.children && d.children.length > 0) {
            console.log('折叠节点:', d.data?.content)
            // 模拟点击事件来折叠节点
            const nodeElement = this
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            })
            nodeElement.dispatchEvent(clickEvent)
          }
        })
      }
      
      // 延迟执行fit以确保渲染完成
      setTimeout(() => {
        if (mmRef.current) {
          mmRef.current.fit()
        }
      }, 500)
    } catch (error) {
      console.error('展开/折叠功能失败:', error)
      // 如果出错，重置状态
      setIsExpanded(!isExpanded)
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
        if (mmRef.current) {
          mmRef.current.fit()
        }
      }, 100)
    }
  }

  useEffect(() => {
    const initMarkmap = async () => {
      if (!mindmapData?.markdown || !svgRef.current || !containerRef.current) {
        console.log('SimpleMarkmapAdvanced: 缺少必要数据或DOM元素')
        return
      }

      try {
        console.log('SimpleMarkmapAdvanced: 开始初始化')
        
        // 清空SVG
        svgRef.current.innerHTML = ''
        
        // 显示加载状态
        svgRef.current.innerHTML = `
          <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-size="12">
            正在渲染思维导图...
          </text>
        `

        // 动态导入 - 使用与基础版本相同的简单方式
        const { Markmap } = await import('markmap-view')
        const { Transformer } = await import('markmap-lib')

        // 创建transformer并转换数据
        const transformer = new Transformer()
        const { root } = transformer.transform(mindmapData.markdown)
        
        if (!root) {
          throw new Error('思维导图数据转换失败')
        }
        
        // 保存原始数据的引用
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
        console.log('SimpleMarkmapAdvanced: 思维导图渲染成功')
        
        // 显示控制按钮
        setShowButtons(true)
        
        // 延迟执行fit以确保渲染完成
        setTimeout(() => {
          if (mmRef.current) {
            mmRef.current.fit()
          }
        }, 300)

      } catch (error) {
        console.error('SimpleMarkmapAdvanced 渲染失败:', error)
        // 隐藏控制按钮
        setShowButtons(false)
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