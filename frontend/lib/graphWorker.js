// graphWorker.js - 在 Worker 中完成 Markdown→Tree→Graph 的解析与转换
// 依赖 markmap-lib 仅做解析，避免主线程阻塞

import { Transformer } from 'markmap-lib'
import dagre from 'dagre'

// v1 Schema 转换：TreeNode → { nodes, edges, meta }
function treeToGraph(root) {
  const nodes = []
  const edges = []
  let idCounter = 0

  function makeId() {
    idCounter += 1
    return `n_${idCounter}`
  }

  function walk(node, level, parentId) {
    const id = makeId()
    const label = String(node?.content?.toString?.() || node?.content || '')
    nodes.push({ id, data: { markdown: label }, label, level, parentId })
    if (parentId) edges.push({ id: `${parentId}__${id}`, source: parentId, target: id, type: 'smoothstep' })
    const children = Array.isArray(node?.children) ? node.children : []
    for (const child of children) walk(child, level + 1, id)
  }

  walk(root, 0, null)
  return { nodes, edges }
}

self.onmessage = (evt) => {
  const { type, payload } = evt.data || {}
  if (type === 'parseMarkdown') {
    const t0 = performance.now()
    try {
      const transformer = new Transformer()
      const parseStart = performance.now()
      const { root } = transformer.transform(payload.markdown || '')
      const parseEnd = performance.now()
      const graphStart = performance.now()
      const g0 = treeToGraph(root)
      const graphEnd = performance.now()
      // 布局（Worker 内完成）
      const layoutStart = performance.now()
      const dg = new dagre.graphlib.Graph()
      dg.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 60 })
      dg.setDefaultEdgeLabel(() => ({}))
      g0.nodes.forEach((n) => dg.setNode(n.id, { width: 180, height: 36 }))
      g0.edges.forEach((e) => dg.setEdge(e.source, e.target))
      dagre.layout(dg)
      const laidNodes = g0.nodes.map((n) => {
        const p = dg.node(n.id)
        return { ...n, position: { x: p.x, y: p.y } }
      })
      const layoutEnd = performance.now()
      const t1 = performance.now()
      self.postMessage({
        type: 'graph',
        payload: {
          nodes: laidNodes,
          edges: g0.edges,
          meta: {
            version: 'v1',
            from: 'markdown',
            parseMs: parseEnd - parseStart,
            treeToGraphMs: graphEnd - graphStart,
            layoutMs: layoutEnd - layoutStart,
            workerTotalMs: t1 - t0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      })
    } catch (e) {
      self.postMessage({ type: 'error', payload: { message: e?.message || String(e) } })
    }
  } else if (type === 'graphToMarkdown') {
    try {
      const { nodes = [], edges = [] } = payload || {}
      // 建立父子关系
      const idToNode = new Map(nodes.map(n => [n.id, n]))
      const childrenMap = new Map()
      const inDeg = new Map(nodes.map(n => [n.id, 0]))
      for (const e of edges) {
        childrenMap.set(e.source, (childrenMap.get(e.source) || []).concat(e.target))
        inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1)
      }
      const roots = nodes.filter(n => (inDeg.get(n.id) || 0) === 0)
      // 深度优先输出 Markdown：level 0 -> #，level1 -> ##，level2 -> ###，>=3 使用列表缩进
      const lines = []
      function visit(id, level) {
        const node = idToNode.get(id)
        const label = (node?.label ?? node?.data?.markdown ?? '').toString()
        if (!label) return
        if (level === 0) lines.push(`# ${label}`)
        else if (level === 1) lines.push(`## ${label}`)
        else if (level === 2) lines.push(`### ${label}`)
        else lines.push(`${'  '.repeat(level - 3)}- ${label}`)
        const kids = (childrenMap.get(id) || [])
        for (const kid of kids) visit(kid, level + 1)
      }
      if (roots.length === 0 && nodes.length > 0) {
        // 无 root，任取第一个
        visit(nodes[0].id, 0)
      } else {
        for (const r of roots) visit(r.id, 0)
      }
      const md = lines.join('\n')
      self.postMessage({ type: 'markdown', payload: { markdown: md } })
    } catch (e) {
      self.postMessage({ type: 'error', payload: { message: e?.message || String(e) } })
    }
  }
}


