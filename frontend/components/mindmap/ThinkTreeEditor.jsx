/**
 * ThinkSo 思维导图编辑器组件 - 基于 ReactFlow
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow'

// 导入 ReactFlow 样式
import 'reactflow/dist/style.css'

// 传统思维导图节点样式
const nodeTypes = {
  default: ({ data, selected }) => (
    <div
      className={`px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-sm ${
        selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      style={{ minWidth: '120px' }}
    >
      <div className="text-gray-800 text-center">{data.label}</div>
    </div>
  ),
  root: ({ data, selected }) => (
    <div
      className={`px-4 py-3 bg-blue-600 text-white border border-blue-700 rounded-lg text-base font-medium ${
        selected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
      style={{ minWidth: '160px' }}
    >
      <div className="text-center">{data.label}</div>
    </div>
  )
}

export default function ThinkTreeEditor({ initialData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(true)

  // 初始化思维导图数据
  useEffect(() => {
    if (initialData && initialData.mindmap) {
      const mindmapData = initialData.mindmap
      
      // 设置节点和边
      if (mindmapData.nodes && Array.isArray(mindmapData.nodes)) {
        const processedNodes = mindmapData.nodes.map((node, index) => ({
          id: node.id || `node-${index}`,
          type: index === 0 ? 'root' : 'default',
          position: node.position || { x: Math.random() * 400, y: Math.random() * 400 },
          data: { label: node.data?.label || `节点 ${index + 1}` },
        }))
        setNodes(processedNodes)
      }
      
      if (mindmapData.edges && Array.isArray(mindmapData.edges)) {
        const processedEdges = mindmapData.edges.map((edge, index) => ({
          id: edge.id || `edge-${index}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: false,
        }))
        setEdges(processedEdges)
      }
      
      setIsLoading(false)
    } else {
      // 如果没有数据，显示示例
      setNodes([
        {
          id: '1',
          type: 'root',
          position: { x: 250, y: 200 },
          data: { label: '中心主题' },
        },
      ])
      setIsLoading(false)
    }
  }, [initialData, setNodes, setEdges])

  // 处理连接
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载思维导图...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        {/* 控制面板 */}
        <Controls />
        
        {/* 小地图 */}
        <MiniMap
          nodeColor="#dbeafe"
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white !border-gray-200"
        />
        
        {/* 背景 */}
        <Background variant="dots" gap={20} size={1} color="#f3f4f6" />
      </ReactFlow>
    </div>
  )
}