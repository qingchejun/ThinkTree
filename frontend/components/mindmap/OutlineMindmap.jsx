'use client'

import React from 'react'
import { Transformer } from 'markmap-lib'

// 将 markmap AST Node 提取为纯文本
function extractText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(extractText).join('')
  if (typeof value === 'object') {
    if ('content' in value) return extractText(value.content)
    if ('t' in value) return extractText(value.t)
    if ('v' in value) return extractText(value.v)
  }
  return String(value)
}

function astToTree(root) {
  function walk(node, level = 0) {
    const label = extractText(node?.content)
    const children = Array.isArray(node?.children) ? node.children.map((c) => walk(c, level + 1)) : []
    return { label, level, children }
  }
  return walk(root, 0)
}

export default function OutlineMindmap({ markdown }) {
  const [tree, setTree] = React.useState(null)
  const [expandedMap, setExpandedMap] = React.useState(new Map())

  React.useEffect(() => {
    try {
      const t = new Transformer()
      const { root } = t.transform(markdown || '')
      const treeData = astToTree(root)
      setTree(treeData)
      // 默认仅展示一级（level = 1），根（level=0）作为标题
      const m = new Map()
      function preset(n) {
        if (!n) return
        if (n.level === 1) m.set(n, true)
        if (n.children) n.children.forEach(preset)
      }
      preset(treeData)
      setExpandedMap(m)
    } catch (e) {
      setTree({ label: '解析失败', level: 0, children: [] })
    }
  }, [markdown])

  const toggle = (node) => {
    setExpandedMap((prev) => {
      const next = new Map(prev)
      next.set(node, !prev.get(node))
      return next
    })
  }

  const collapseToLevel1 = () => {
    setExpandedMap((_) => {
      const next = new Map()
      function visit(n) {
        if (n.level === 1) next.set(n, true)
        if (n.children) n.children.forEach(visit)
      }
      if (tree) visit(tree)
      return next
    })
  }

  const expandAll = () => {
    setExpandedMap((_) => {
      const next = new Map()
      function visit(n) {
        next.set(n, true)
        if (n.children) n.children.forEach(visit)
      }
      if (tree) visit(tree)
      return next
    })
  }

  const NodeView = ({ node }) => {
    const isRoot = node.level === 0
    const isFirst = node.level === 1
    const expanded = expandedMap.get(node) || false
    const hasChildren = node.children && node.children.length > 0
    return (
      <section className={`relative ${isRoot ? 'mb-6' : 'mb-3'} pl-4`}> 
        {/* 主干线/分支线 */}
        {node.level === 1 && (
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 rounded" aria-hidden />
        )}
        {node.level > 1 && (
          <span className="absolute left-0 top-3 bottom-1 border-l border-slate-300" aria-hidden />
        )}

        {/* 标题行 */}
        <div className={`flex items-start ${isRoot ? 'text-2xl font-bold text-slate-900' : isFirst ? 'text-lg font-semibold text-slate-800' : 'text-sm text-slate-800'}`}>
          {hasChildren && !isRoot && (
            <button onClick={() => toggle(node)} className="mr-2 mt-[2px] text-slate-500 hover:text-slate-700" aria-label={expanded ? '折叠' : '展开'}>
              {expanded ? '▾' : '▸'}
            </button>
          )}
          <div className={`bg-white ${isRoot ? '' : isFirst ? 'rounded border border-slate-200 px-3 py-1' : 'rounded border border-slate-200 px-2 py-1'} max-w-[720px] break-words leading-6`}>{node.label || '（空）'}</div>
        </div>

        {/* 子级 */}
        {hasChildren && (isRoot || expanded) && (
          <div className={`ml-6 mt-2 space-y-2`}>
            {node.children.map((child, idx) => (
              <div key={idx} className="relative">
                {/* 横向分支线 */}
                <span className="absolute -left-6 top-3 w-6 border-t border-slate-300" aria-hidden />
                <NodeView node={child} />
              </div>
            ))}
          </div>
        )}
      </section>
    )
  }

  if (!tree) return <div className="w-full h-full flex items-center justify-center text-slate-500">正在生成大纲...</div>

  return (
    <div className="w-full h-full overflow-auto p-6 bg-white">
      {/* 操作区 */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button onClick={collapseToLevel1} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">折叠到一级</button>
        <button onClick={expandAll} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">展开全部</button>
      </div>
      <NodeView node={tree} />
    </div>
  )
}


