/**
 * 简单的思维导图组件 - 基于CSS布局
 */
'use client'

import { useState, useEffect } from 'react'

export default function SimpleMindMap({ mindmapData }) {
  const [nodes, setNodes] = useState([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (mindmapData && mindmapData.nodes) {
      setNodes(mindmapData.nodes)
      setTitle(mindmapData.title || '思维导图')
    }
  }, [mindmapData])

  if (!mindmapData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">🌳</div>
          <p>暂无思维导图数据</p>
        </div>
      </div>
    )
  }

  // 找到根节点
  const rootNode = nodes.find(node => node.type === 'root')
  // 找到分支节点
  const branchNodes = nodes.filter(node => node.type === 'default')

  return (
    <div className="h-full bg-white p-6 overflow-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>

      <div className="flex flex-col items-center space-y-8">
        {/* 根节点 */}
        {rootNode && (
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium shadow-lg">
            {rootNode.data.label}
          </div>
        )}

        {/* 分支节点 - 网格布局 */}
        {branchNodes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
            {branchNodes.map((node, index) => (
              <div key={node.id || index} className="flex flex-col items-center">
                {/* 连接线 */}
                <div className="w-px h-8 bg-gray-300 mb-2"></div>
                
                {/* 分支节点 */}
                <div className="bg-blue-50 border-2 border-blue-200 px-4 py-2 rounded-lg text-center min-w-[120px] shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-gray-800 text-sm font-medium">
                    {node.data.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="mt-8 text-center text-xs text-gray-500">
        共 {nodes.length} 个节点
      </div>
    </div>
  )
}