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

function decodeLabel(raw) {
  let s = String(raw || '')
  // %E4%B8%AD%E6%96%87
  if (/%[0-9A-Fa-f]{2}/.test(s)) {
    try { s = decodeURIComponent(s) } catch {}
  }
  // \u4e2d\u6587
  s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, g1) => {
    try { return String.fromCharCode(parseInt(g1, 16)) } catch { return _ }
  })
  // 实体与数字实体
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return _ }
  })
  s = s.replace(/&#(\d+);/g, (_, dec) => {
    try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return _ }
  })
  // \xHH
  s = s.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => {
    try { return String.fromCharCode(parseInt(h, 16)) } catch { return _ }
  })
  return s
}

function astToTree(root) {
  function walk(node, level = 0) {
    const label = decodeLabel(extractText(node?.content))
    const children = Array.isArray(node?.children) ? node.children.map((c) => walk(c, level + 1)) : []
    return { label, level, children }
  }
  return walk(root, 0)
}

export default function OutlineMindmap({ markdown, mindmapId }) {
  const [tree, setTree] = React.useState(null)
  const [expandedSet, setExpandedSet] = React.useState(new Set())
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef(null)
  const idToRef = React.useRef(new Map())

  React.useEffect(() => {
    try {
      const t = new Transformer()
      const { root } = t.transform(markdown || '')
      // 为节点生成稳定 id（基于路径）
      function withIds(node, path = []) {
        const id = path.join('.') || 'root'
        const cur = { id, label: node.label, level: node.level, children: [] }
        cur.children = (node.children || []).map((c, i) => withIds(c, path.concat(i)))
        return cur
      }
      const treeData = withIds(astToTree(root))
      setTree(treeData)
      // 尝试恢复展开状态
      const key = `outline_expanded_${mindmapId || 'default'}`
      const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(key) || '[]') : []
      if (saved.length > 0) {
        setExpandedSet(new Set(saved))
      } else {
        // 默认仅显示“一级目录本身”，不展示其子级
        // 因为 children 展示条件为 (isRoot || expanded)，此处保持为空即可
        setExpandedSet(new Set())
      }
    } catch (e) {
      setTree({ label: '解析失败', level: 0, children: [] })
    }
  }, [markdown, mindmapId])

  // 持久化展开状态
  React.useEffect(() => {
    if (!tree) return
    const key = `outline_expanded_${mindmapId || 'default'}`
    try { localStorage.setItem(key, JSON.stringify(Array.from(expandedSet))) } catch {}
  }, [expandedSet, tree, mindmapId])

  const toggle = (node) => {
    setExpandedSet((prev) => {
      const next = new Set(prev)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }

  const collapseToLevel1 = () => {
    // 仅显示“一级目录标题”，不展开任何子级
    setExpandedSet(new Set())
  }

  const expandAll = () => {
    const next = new Set()
    function visit(n) { next.add(n.id); n.children?.forEach(visit) }
    if (tree) visit(tree)
    setExpandedSet(next)
  }

  // 语义层级：根为 0（不计入目录级别），因此“展开到二级”应展开到实际 level<=1
  const expandToSemanticLevel = (semanticMax = 2) => {
    const maxLevel = Math.max(0, (semanticMax | 0) - 1)
    const next = new Set()
    function visit(n) {
      if (n.level <= maxLevel) next.add(n.id)
      n.children?.forEach(visit)
    }
    if (tree) visit(tree)
    setExpandedSet(next)
  }

  // 搜索与自动展开
  const matchesId = React.useMemo(() => {
    const term = (search || '').trim().toLowerCase()
    if (!term || !tree) return new Set()
    const set = new Set()
    function walk(n, parentChain = []) {
      const ok = (n.label || '').toLowerCase().includes(term)
      if (ok) {
        set.add(n.id)
        // 展开祖先链
        parentChain.forEach((pid) => set.add(pid))
      }
      n.children?.forEach((c) => walk(c, parentChain.concat(n.id)))
    }
    walk(tree, [])
    return set
  }, [search, tree])

  React.useEffect(() => {
    if (matchesId.size === 0) return
    // 合并到展开集合并滚动到第一个匹配
    setExpandedSet((prev) => new Set([...prev, ...Array.from(matchesId)]))
    const first = Array.from(matchesId)[0]
    const el = idToRef.current.get(first)
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [matchesId])

  const highlight = (label, term) => {
    if (!term) return label
    const idx = label.toLowerCase().indexOf(term.toLowerCase())
    if (idx === -1) return label
    return (
      <>
        {label.slice(0, idx)}<mark className="bg-yellow-200 px-0.5 rounded-sm">{label.slice(idx, idx + term.length)}</mark>{label.slice(idx + term.length)}
      </>
    )
  }

  const NodeView = ({ node }) => {
    const isRoot = node.level === 0
    const isFirst = node.level === 1
    const expanded = expandedSet.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    return (
      <section ref={(el) => el && idToRef.current.set(node.id, el)} id={`sec-${node.id}`} className={`relative ${isRoot ? 'mb-6' : 'mb-3'} pl-4`}> 
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
          <div className={`bg-white ${isRoot ? '' : isFirst ? 'rounded border border-slate-200 px-3 py-1' : 'rounded border border-slate-200 px-2 py-1'} max-w-[720px] break-words leading-6`}>{highlight(node.label || '（空）', search)}</div>
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

  // TOC（仅展示 level=1 标题）
  const toc = React.useMemo(() => {
    if (!tree) return []
    return (tree.children || []).filter(n => n.level === 1).map((n, i) => ({ id: n.id, label: n.label, index: i }))
  }, [tree])

  const jumpTo = (id) => {
    const el = idToRef.current.get(id)
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // 自动展开至该节
    setExpandedSet((prev) => new Set([...prev, id]))
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto p-6 bg-white relative">
      {/* 顶部工具 */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索..." className="px-2 py-1 text-xs border rounded w-56" />
        <div className="flex items-center gap-2">
          <button onClick={collapseToLevel1} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">折叠到一级</button>
          <button onClick={() => expandToSemanticLevel(2)} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">展开到二级</button>
          <button onClick={expandAll} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">展开全部</button>
        </div>
      </div>

      {/* 内容与 TOC */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          {tree ? (
            <NodeView node={tree} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">正在生成大纲...</div>
          )}
        </div>
        <aside className="col-span-3">
          <div className="sticky top-4">
            <div className="text-xs text-slate-500 mb-2">目录</div>
            <ul className="space-y-1 text-sm">
              {toc.map(item => (
                <li key={item.id}>
                  <button onClick={() => jumpTo(item.id)} className="text-slate-700 hover:text-indigo-600 hover:underline">
                    {item.index + 1}. {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}


