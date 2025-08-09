'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import { Plus, Trash2, Save, RotateCw, RotateCcw, ChevronDown, ChevronRight, Search, X as XIcon } from 'lucide-react'
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

// 可编辑节点
function EditableNode({ id, data }) {
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState(data.label || '')
  React.useEffect(() => setText(data.label || ''), [data.label])
  return (
    <div className="rounded border bg-white shadow px-2 py-1 text-sm min-w-[120px] max-w-[220px]">
      {editing ? (
        <input
          className="w-full outline-none border rounded px-1 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              data.onUpdateLabel(id, text.trim() || '节点')
              setEditing(false)
            } else if (e.key === 'Escape') {
              setText(data.label || '')
              setEditing(false)
            }
          }}
          onBlur={() => {
            data.onUpdateLabel(id, text.trim() || '节点')
            setEditing(false)
          }}
          autoFocus
        />
      ) : (
        <div className="flex items-center">
          <button title={data.collapsed ? '展开' : '折叠'} onClick={() => data.onToggleCollapse(id)} className="mr-1 text-gray-500 hover:text-gray-700">
            {data.collapsed ? <ChevronRight size={14}/> : <ChevronDown size={14}/>}
          </button>
          <div className={`flex-1 break-words ${data.highlight ? 'bg-yellow-100' : ''}`} onDoubleClick={() => setEditing(true)} title={data.label}>{data.label}</div>
          <button title="添加子节点" onClick={() => data.onAddChild(id)} className="ml-2 text-green-600 hover:text-green-700">
            <Plus size={14} />
          </button>
          <button title="删除节点" onClick={() => data.onRemoveNode(id)} className="ml-1 text-red-600 hover:text-red-700">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

const nodeTypes = { editable: EditableNode }

export default function ReactFlowMindmap({ markdown, mindmapId }) {
  const workerRef = useRef(null)
  const [rfData, setRfData] = useState({ nodes: [], edges: [] })
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)
  const historyRef = useRef({ stack: [], redo: [] })
  const [dirty, setDirty] = useState(false)
  const [collapsedSet, setCollapsedSet] = useState(() => new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [matchedIds, setMatchedIds] = useState(new Set())
  // MiniMap 控制：默认关闭；大图进入“简化模式”仅显示视口框
  const [showMiniMap, setShowMiniMap] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('rfMiniMap') === '1'
  })
  const [miniMapReady, setMiniMapReady] = useState(false)
  const edgeOptions = useMemo(() => ({
    type: 'straight',
    style: { stroke: '#64748b', strokeWidth: 2.2, opacity: 0.98 },
  }), [])

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
        const { nodes, edges, meta, debug } = payload
        try {
          if (typeof window !== 'undefined' && window?.localStorage?.getItem('rfDebug') === '1') {
            // 打印前 10 个节点与样本
            // eslint-disable-next-line no-console
            console.log('[RF][debug] first nodes', nodes.slice(0, 10).map(n => n.label))
            // eslint-disable-next-line no-console
            console.log('[RF][debug] samples', debug?.samples || [])
          }
        } catch {}
        // 默认折叠：level 大于 3
        const defaultCollapsed = new Set(nodes.filter(n => (n.level ?? 0) > 3).map(n => n.id))
        setCollapsedSet(defaultCollapsed)
        const laidNodes = nodes.map((n) => ({ ...n, type: 'editable', data: { ...n.data, label: n.label } }))
        setRfData({ nodes: laidNodes, edges })
        setMetrics({
          parseMs: Math.round(meta.parseMs),
          treeToGraphMs: Math.round(meta.treeToGraphMs),
          workerTotalMs: Math.round(meta.workerTotalMs),
          mainThreadReceiveMs: Math.round(t1 - t0),
          layoutMs: Math.round(meta.layoutMs || 0),
          nodeCount: nodes.length,
          edgeCount: edges.length,
        })
        // 延迟挂载 MiniMap，避免抢占首屏时间
        try {
          const schedule = (cb) => (window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 800 }) : setTimeout(cb, 200))
          schedule(() => setMiniMapReady(true))
        } catch { setMiniMapReady(true) }
      } else if (type === 'error') {
        setError(payload?.message || '解析失败')
      }
    }
    worker.postMessage({ type: 'parseMarkdown', payload: { markdown } })
    return () => worker && worker.terminate()
  }, [markdown])

  // 记忆 MiniMap 开关
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem('rfMiniMap', showMiniMap ? '1' : '0') } catch {}
  }, [showMiniMap])

  // 操作工具
  const commit = (apply, inverse) => {
    setRfData(prev => {
      const next = apply(prev)
      return { ...next }
    })
    const h = historyRef.current
    h.stack.push(inverse)
    h.redo = []
    setDirty(true)
  }

  const api = {
    onAddChild: (parentId) => {
      const newId = `n_${Date.now().toString(36)}`
      const apply = (prev) => ({
        nodes: [...prev.nodes, { id: newId, type: 'editable', data: { label: '新节点', markdown: '新节点' }, position: { x: 0, y: 0 } }],
        edges: [...prev.edges, { id: `${parentId}__${newId}`, source: parentId, target: newId, type: 'smoothstep' }],
      })
      const inverse = (prev) => ({
        nodes: prev.nodes.filter(n => n.id !== newId),
        edges: prev.edges.filter(e => e.source !== parentId || e.target !== newId),
      })
      commit(apply, inverse)
    },
    onRemoveNode: (id) => {
      // 移除子树
      const captureSubtree = (nodes, edges, rootId) => {
        const childMap = new Map()
        edges.forEach(e => childMap.set(e.source, (childMap.get(e.source) || []).concat(e.target)))
        const toDelete = new Set()
        const dfs = (nid) => {
          toDelete.add(nid)
          ;(childMap.get(nid) || []).forEach(dfs)
        }
        dfs(rootId)
        const removedNodes = nodes.filter(n => toDelete.has(n.id))
        const removedEdges = edges.filter(e => toDelete.has(e.source) || toDelete.has(e.target))
        return { removedNodes, removedEdges }
      }
      const snapshot = captureSubtree(rfData.nodes, rfData.edges, id)
      const apply = (prev) => ({
        nodes: prev.nodes.filter(n => !snapshot.removedNodes.find(r => r.id === n.id)),
        edges: prev.edges.filter(e => !snapshot.removedEdges.find(r => r.id === e.id)),
      })
      const inverse = (prev) => ({
        nodes: [...prev.nodes, ...snapshot.removedNodes],
        edges: [...prev.edges, ...snapshot.removedEdges],
      })
      commit(apply, inverse)
    },
    onUpdateLabel: (id, newLabel) => {
      const old = rfData.nodes.find(n => n.id === id)?.data?.label || ''
      const apply = (prev) => ({
        nodes: prev.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, label: newLabel, markdown: newLabel } } : n),
        edges: prev.edges,
      })
      const inverse = (prev) => ({
        nodes: prev.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, label: old, markdown: old } } : n),
        edges: prev.edges,
      })
      commit(apply, inverse)
    },
  }

  // 折叠控制
  const onToggleCollapse = (id) => {
    setCollapsedSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 可见节点/边（过滤掉折叠祖先的子树）
  const visible = React.useMemo(() => {
    const idToParent = new Map(rfData.nodes.map(n => [n.id, n.parentId]))
    const isHidden = (id) => {
      let cur = idToParent.get(id)
      while (cur) {
        if (collapsedSet.has(cur)) return true
        cur = idToParent.get(cur)
      }
      return false
    }
    const vNodes = rfData.nodes.filter(n => !isHidden(n.id)).map(n => ({
      ...n,
      data: {
        ...n.data,
        ...api,
        onToggleCollapse,
        collapsed: collapsedSet.has(n.id),
        highlight: matchedIds.has(n.id),
      },
    }))
    const keep = new Set(vNodes.map(n => n.id))
    const vEdges = rfData.edges.filter(e => keep.has(e.source) && keep.has(e.target))
    return { nodes: vNodes, edges: vEdges }
  }, [rfData, collapsedSet, matchedIds])

  // 搜索与高亮
  const applySearch = (term) => {
    const t = (term || '').trim().toLowerCase()
    setSearchTerm(term)
    if (!t) { setMatchedIds(new Set()); return }
    const matches = rfData.nodes.filter(n => (n.data?.label || '').toLowerCase().includes(t)).map(n => n.id)
    setMatchedIds(new Set(matches))
    if (matches.length > 0) {
      // 展开首个匹配的祖先链
      const idToParent = new Map(rfData.nodes.map(n => [n.id, n.parentId]))
      const chain = []
      let cur = idToParent.get(matches[0])
      while (cur) { chain.push(cur); cur = idToParent.get(cur) }
      setCollapsedSet(prev => {
        const next = new Set(prev)
        chain.forEach(a => next.delete(a))
        return next
      })
    }
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-600">{error}</div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={visible.nodes}
        edges={visible.edges}
        fitView
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        onConnect={(params) => {
          const { source, target } = params
          if (!source || !target) return
          // 重设父边：移除旧的以 target 为终点的边，新增 source->target
          const oldParentEdge = rfData.edges.find(e => e.target === target)
          const apply = (prev) => ({
            nodes: prev.nodes,
            edges: [
              ...prev.edges.filter(e => e.target !== target),
              { id: `${source}__${target}`, source, target, type: 'smoothstep' },
            ],
          })
          const inverse = (prev) => ({
            nodes: prev.nodes,
            edges: [
              ...prev.edges.filter(e => !(e.source === source && e.target === target)),
              ...(oldParentEdge ? [oldParentEdge] : []),
            ],
          })
          commit(apply, inverse)
        }}
      >
        {/* 背景：网格更浅，提升“线条”可读性 */}
        <Background gap={24} size={1} color="#eef1f5" />
        {/* 连接线样式：使用默认 smoothstep，增强层级从属可见度 */}
        <Controls showInteractive={false} />
        {showMiniMap && miniMapReady && (
          <div className={rfData.nodes.length > 600 ? 'minimap-simplified' : ''}>
            <MiniMap pannable zoomable />
          </div>
        )}
      </ReactFlow>
      {/* 调试：当 rfDebug=1 时打印当前 edges 数量与示例，便于线上定位 */}
      {typeof window !== 'undefined' && window.localStorage.getItem('rfDebug') === '1' && (
        <div className="absolute left-2 bottom-2 text-[10px] text-gray-500 bg-white/70 border rounded px-2 py-1">
          edges: {rfData.edges.length}
        </div>
      )}
      {/* 简化 MiniMap 样式：仅显示视口，隐藏节点矩形，减少 DOM */}
      {(showMiniMap && rfData.nodes.length > 600) || true ? (
        <style>{`
          .minimap-simplified .react-flow__minimap-node { display: none; }
          .minimap-simplified .react-flow__minimap-mask { stroke: #9ca3af; stroke-width: 1; }
          /* 统一边样式，增强从属层级的可见度 */
          .react-flow__edge-path { stroke: #cbd5e1 !important; stroke-width: 1.5px; }
          .react-flow__connection-path { stroke: #cbd5e1 !important; }
        `}</style>
      ) : null}
      {metrics && (
        <div className="absolute top-2 right-2 bg-white/90 border rounded px-3 py-2 text-xs text-gray-700 shadow">
          <div>节点: {metrics.nodeCount} 边: {metrics.edgeCount}</div>
          <div>解析: {metrics.parseMs}ms 转换: {metrics.treeToGraphMs}ms</div>
          <div>Worker: {metrics.workerTotalMs}ms 布局: {metrics.layoutMs}ms</div>
        </div>
      )}
      {/* 搜索框 */}
      <div className="absolute top-2 left-2 bg-white/90 border rounded px-2 py-1 text-xs flex items-center space-x-1 shadow">
        <Search size={14} className="text-gray-500"/>
        <input
          className="outline-none text-xs bg-transparent"
          placeholder="搜索..."
          value={searchTerm}
          onChange={(e) => applySearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') applySearch('') }}
          style={{ width: 160 }}
        />
        {searchTerm && (
          <button onClick={() => applySearch('')} className="text-gray-500 hover:text-gray-700"><XIcon size={14}/></button>
        )}
      </div>
      {/* 导出按钮（将 Graph 转回 Markdown，供保存/回退验证） */}
      <div className="absolute bottom-2 right-2 space-x-2">
        <button
          onClick={() => setShowMiniMap(v => !v)}
          className="px-2 py-1 text-xs border rounded bg-white/90"
        >{showMiniMap ? '隐藏MiniMap' : '显示MiniMap'}</button>
        <button
          onClick={() => {
            const inv = historyRef.current.stack.pop()
            if (!inv) return
            setRfData(prev => ({ ...inv(prev) }))
            historyRef.current.redo.push(inv) // 简化：redo 栈复用
            setDirty(true)
          }}
          className="px-2 py-1 text-xs border rounded bg-white/90"
        ><RotateCcw size={14}/> 撤销</button>
        <button
          onClick={() => {
            const redo = historyRef.current.redo.pop()
            if (!redo) return
            // redo 实际上需要重放正向操作，这里为了简化：再次执行 inverse 的 inverse
            setRfData(prev => ({ ...redo(prev) }))
            setDirty(true)
          }}
          className="px-2 py-1 text-xs border rounded bg-white/90"
        ><RotateCw size={14}/> 重做</button>
        <button
          onClick={() => {
            if (!workerRef.current) return
            workerRef.current.onmessage = (evt) => {
              const { type, payload } = evt.data || {}
              if (type === 'markdown') {
                const blob = new Blob([payload.markdown || ''], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'mindmap.md'
                a.click()
                URL.revokeObjectURL(url)
              }
            }
            workerRef.current.postMessage({ type: 'graphToMarkdown', payload: rfData })
          }}
          className="px-2 py-1 text-xs border rounded bg-white/90"
        >导出Markdown(beta)</button>
        {mindmapId && (
          <button
            onClick={() => {
              // 先转 Markdown 再保存
              const w = createGraphWorker()
              if (!w) return
              w.onmessage = async (evt) => {
                if (evt.data?.type === 'markdown') {
                  const md = evt.data.payload?.markdown || ''
                  try {
                    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
                      method: 'PATCH',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ content: md }),
                    })
                    if (resp.ok) setDirty(false)
                  } catch {}
                  w.terminate()
                }
              }
              w.postMessage({ type: 'graphToMarkdown', payload: rfData })
            }}
            disabled={!dirty}
            className={`px-2 py-1 text-xs border rounded ${dirty ? 'bg-green-600 text-white' : 'bg-white/90 text-gray-600'}`}
          ><Save size={14}/> {dirty ? '保存' : '已保存'}</button>
        )}
      </div>
    </div>
  )
}


