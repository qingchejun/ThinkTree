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

function stripHtmlTags(s) {
  if (!s) return ''
  return String(s).replace(/<[^>]*>/g, '')
}

function astToTree(root) {
  function walk(node, level = 0) {
    const label = stripHtmlTags(decodeLabel(extractText(node?.content)))
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
          // 清理空白节点：label 去空格后为空，且无子节点
          .filter((c) => (c.label || '').trim().length > 0 || (c.children && c.children.length > 0))
        return cur
      }
      const treeData = withIds(astToTree(root))
      setTree(treeData)
      // 默认仅显示“一级目录本身”，不展示其子级（不再从缓存恢复，满足“默认折叠到一级”需求）
      setExpandedSet(new Set())
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
    const text = stripHtmlTags(label || '')
    if (!term) return text
    const idx = text.toLowerCase().indexOf(term.toLowerCase())
    if (idx === -1) return label
    return (
      <>
        {text.slice(0, idx)}<mark className="bg-yellow-200 px-0.5 rounded-sm">{text.slice(idx, idx + term.length)}</mark>{text.slice(idx + term.length)}
      </>
    )
  }

  // 渲染三级及以下为“内容项”列表
  const ContentItems = ({ node, depth = 0 }) => {
    const items = []
    const pad = Math.min(depth, 3) * 16
    items.push(
      <div key={`${node.id}-ci`} style={{ marginLeft: pad }}>
        <div className="relative pl-5 mb-2 text-[14px] leading-[22px] text-[#2c3e50]">
          <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-[#3498db]" aria-hidden />
          {highlight(node.label || '（空）', search)}
        </div>
      </div>
    )
    node.children?.forEach((c) => items.push(<ContentItems key={c.id} node={c} depth={depth + 1} />))
    return items
  }

  const ArticleBlock = ({ node }) => {
    const expanded = expandedSet.has(node.id)
    return (
      <div className="article border-b border-[#f0f0f0] bg-white rounded-md overflow-hidden shadow-sm">
        <div className="article-header px-4 py-2 text-[16px] font-semibold text-[#2c3e50] border-l-4 border-[#3498db] cursor-pointer hover:bg-[#f8f9fa]"
             onClick={() => toggle(node)}>
          <span className="mr-2 text-black">{expanded ? '▾' : '▸'}</span>
          {highlight(node.label || '（空）', search)}
        </div>
        {expanded && node.children && node.children.length > 0 && (
          <div className="article-content bg-[#fafafa] px-6 py-4">
            {node.children?.map((c) => (
              <ContentItems key={c.id} node={{...c, label: stripHtmlTags(c.label)}} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const ChapterBlock = ({ node }) => {
    const expanded = expandedSet.has(node.id)
    return (
      <div ref={(el) => el && idToRef.current.set(node.id, el)} id={`sec-${node.id}`} className="chapter mb-4 border border-[#e0e0e0] rounded-lg overflow-hidden shadow-sm">
        <div className="chapter-header bg-[#e8f4fd] px-5 py-3 text-[20px] font-bold text-[#2c3e50] cursor-pointer hover:bg-[#d6eafd] flex items-center"
             onClick={() => toggle(node)}>
          <span className="mr-2 text-black">{expanded ? '▾' : '▸'}</span>
          {highlight(node.label || '（空）', search)}
        </div>
        {expanded && (
          <div className="chapter-content">
            {node.children?.map((c) => (
              <ArticleBlock key={c.id} node={c} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const NodeView = ({ node }) => {
    if (node.level === 0) {
      return (
        <section className="mb-4">
          <h1 className="text-[28px] font-bold text-[#2c3e50] mb-3">{highlight(node.label || '（空）', search)}</h1>
          {node.children?.map((c) => (
            <ChapterBlock key={c.id} node={c} />
          ))}
        </section>
      )
    }
    if (node.level === 1) return <ChapterBlock node={node} />
    if (node.level === 2) return <ArticleBlock node={node} />
    return <ContentItems node={node} />
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
      {/* 顶部：左侧标题 + 右侧按钮（顶端对齐） */}
      <div className="flex items-start justify-between mb-3">
        <h1 className="text-[28px] font-bold text-[#2c3e50] leading-tight m-0">{tree ? stripHtmlTags(tree.label || '（空）') : '...'}</h1>
      </div>

      {/* 内容与 TOC */}
      <div className="grid grid-cols-12 gap-6 mt-0">
        <div className="col-span-9 max-w-3xl">
          {tree ? (
            // 仅渲染根的子章节，标题已在顶部输出
            (tree.children || []).map((c) => <ChapterBlock key={c.id} node={c} />)
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">正在生成大纲...</div>
          )}
        </div>
        <aside className="col-span-3">
          <div className="sticky top-4">
            {/* 固定的控制按钮 */}
            <div className="flex items-center gap-2 mb-3">
              <button onClick={collapseToLevel1} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">折叠到一级</button>
              <button onClick={() => expandToSemanticLevel(2)} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">展开到二级</button>
              <button onClick={expandAll} className="px-3 py-1 text-xs border rounded bg-white hover:bg-slate-50">展开全部</button>
            </div>
            {/* 搜索框：位于按钮下方、目录上方，左侧与目录左侧对齐 */}
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索..." className="w-full px-2 py-1 text-xs border rounded mb-3" />
            <div className="text-xs text-slate-500 mb-2">目录</div>
            <ul className="space-y-1 text-sm">
              {toc.map(item => (
                <li key={item.id}>
                  <button onClick={() => jumpTo(item.id)} className={`text-left ${/* active state to be set below */''} w-full text-slate-700 hover:text-indigo-600 hover:underline`}>
                    {item.index + 1}. {stripHtmlTags(item.label)}
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


