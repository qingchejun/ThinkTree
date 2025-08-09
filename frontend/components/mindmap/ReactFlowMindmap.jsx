'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'

// Worker 实例化工具（Vite/Next 均支持 new URL）
function createGraphWorker() {
  try {
    return new Worker(new URL('../../lib/graphWorker.js', import.meta.url), { type: 'module' })
  } catch {
    return null
  }
}

export default function ReactFlowMindmap({ markdown }) {
  const workerRef = useRef(null)
  const [rfData, setRfData] = useState({ nodes: [], edges: [] })
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!markdown) return
    const t0 = performance.now()
    const worker = createGraphWorker()
    workerRef.current = worker
    if (!worker) {
      setError('浏览器不支持 Web Worker')
      return
    }
    worker.onmessage = (evt) => {
      const { type, payload } = evt.data || {}
      if (type === 'graph') {
        const t1 = performance.now()
        // 使用 dagre 做简单层次布局
        const layoutStart = performance.now()
        const { nodes, edges, meta } = payload
        const g = new dagre.graphlib.Graph()
        g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 60 })
        g.setDefaultEdgeLabel(() => ({}))
        nodes.forEach((n) => g.setNode(n.id, { width: 180, height: 36 }))
        edges.forEach((e) => g.setEdge(e.source, e.target))
        dagre.layout(g)
        const laidNodes = nodes.map((n) => {
          const p = g.node(n.id)
          return { ...n, position: { x: p.x, y: p.y } }
        })
        const layoutEnd = performance.now()
        setRfData({ nodes: laidNodes, edges })
        setMetrics({
          parseMs: Math.round(meta.parseMs),
          treeToGraphMs: Math.round(meta.treeToGraphMs),
          workerTotalMs: Math.round(meta.workerTotalMs),
          mainThreadReceiveMs: Math.round(t1 - t0),
          layoutMs: Math.round(layoutEnd - layoutStart),
          nodeCount: nodes.length,
          edgeCount: edges.length,
        })
      } else if (type === 'error') {
        setError(payload?.message || '解析失败')
      }
    }
    worker.postMessage({ type: 'parseMarkdown', payload: { markdown } })
    return () => worker && worker.terminate()
  }, [markdown])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-600">{error}</div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <ReactFlow nodes={rfData.nodes} edges={rfData.edges} fitView>
        <Background />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>
      {metrics && (
        <div className="absolute top-2 right-2 bg-white/90 border rounded px-3 py-2 text-xs text-gray-700 shadow">
          <div>节点: {metrics.nodeCount} 边: {metrics.edgeCount}</div>
          <div>解析: {metrics.parseMs}ms 转换: {metrics.treeToGraphMs}ms</div>
          <div>Worker: {metrics.workerTotalMs}ms 布局: {metrics.layoutMs}ms</div>
        </div>
      )}
    </div>
  )
}


