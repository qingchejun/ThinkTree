// graphWorker.js - 在 Worker 中完成 Markdown→Tree→Graph 的解析与转换
// 依赖 markmap-lib 仅做解析，避免主线程阻塞

import { Transformer } from 'markmap-lib'

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
      const g = treeToGraph(root)
      const graphEnd = performance.now()
      const t1 = performance.now()
      self.postMessage({
        type: 'graph',
        payload: {
          ...g,
          meta: {
            version: 'v1',
            from: 'markdown',
            parseMs: parseEnd - parseStart,
            treeToGraphMs: graphEnd - graphStart,
            workerTotalMs: t1 - t0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      })
    } catch (e) {
      self.postMessage({ type: 'error', payload: { message: e?.message || String(e) } })
    }
  }
}


