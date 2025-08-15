/**
 * 新建思维导图页面 - 重构版本
 * 采用组件化架构，提升可维护性和开发效率
 * 基于设计系统 v2.0 优化视觉设计和用户体验
 */
'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/context/ModalContext'
import { Menu, X } from 'lucide-react'
import FileUpload from '@/components/upload/FileUpload'

// 导入新的子组件
import {
  SourceSelector,
  TextInput,
  ParameterPanel,
  ActionPanel,
  PreviewPanel,
  HistoryPanel
} from '@/components/creation'

export default function NewPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const { openLoginModal } = useModal()
  const router = useRouter()

  // 核心状态
  const [source, setSource] = useState('text')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [mapStyle, setMapStyle] = useState('original')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [estimate, setEstimate] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savedId, setSavedId] = useState(null)

  // 折叠状态管理
  const [collapsed, setCollapsed] = useState({ 
    source: false, 
    basic: false, 
    advanced: false, 
    actions: false,
    history: false
  })

  // 移动端侧边栏状态
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // refs
  const estimateAbortRef = useRef(null)
  const uploadRef = useRef(null)

  // 认证检查
  useEffect(() => {
    if (!isLoading && !user) router.push('/?auth=login')
  }, [user, isLoading, router])

  // 持久化折叠状态
  useEffect(() => {
    try {
      const raw = localStorage.getItem('thinkso:new-page:collapsed')
      if (raw) {
        const obj = JSON.parse(raw)
        setCollapsed({
          source: !!obj.source,
          basic: !!obj.basic,
          advanced: !!obj.advanced,
          actions: !!obj.actions,
          history: !!obj.history,
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { 
      localStorage.setItem('thinkso:new-page:collapsed', JSON.stringify(collapsed)) 
    } catch {}
  }, [collapsed])

  // 移动端侧边栏关闭处理
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setMobileSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 阻止移动端侧边栏打开时的背景滚动
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileSidebarOpen])

  // URL参数处理
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const src = (params.get('source') || '').toLowerCase()
      const sty = (params.get('style') || '').toLowerCase()
      const dbg = params.get('debug')
      if (src === 'upload' || src === 'text') setSource(src)
      if (sty === 'refined' || sty === 'original') setMapStyle(sty)
      if (dbg === '1') {
        // 在全局挂一个简单的调试开关
        try { window.TS_DEBUG = true } catch {}
        console.log('[DEBUG] NewPage 调试模式已开启')
      }
      setTimeout(() => {
        const el = document.getElementById('group-source')
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }
      }, 150)
    } catch {}
  }, [])

  // 通用 fetch 函数
  const fetchWithRetry = async (url, opts={}, { retries=2, baseDelay=400 } = {}) => {
    let attempt = 0
    while (true) {
      try {
        const res = await fetch(url, opts)
        if (res.status === 401) {
          if (openLoginModal) openLoginModal()
          throw new Error('需要登录')
        }
        return res
      } catch (e) {
        if (attempt >= retries) throw e
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, delay))
        attempt += 1
      }
    }
  }

  // 估算积分消耗
  const handleEstimateText = async (val) => {
    if (estimateAbortRef.current) { 
      try { estimateAbortRef.current.abort() } catch {} 
    }
    if (!val.trim()) { 
      setEstimate(null)
      return 
    }
    
    try {
      setEstimating(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const controller = new AbortController()
      estimateAbortRef.current = controller
      const payload = val.length > 100000 ? val.slice(0, 100000) : val
      const res = await fetchWithRetry(`${API_BASE_URL}/api/estimate-credit-cost`, {
        method: 'POST', 
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ text: payload.trim() }), 
        signal: controller.signal
      }, { retries: 2 })
      
      if (res.ok) {
        setEstimate(await res.json())
      } else {
        setEstimate(null)
      }
    } catch { 
      setEstimate(null) 
    } finally { 
      setEstimating(false)
      estimateAbortRef.current = null 
    }
  }

  // 自动保存
  const autoSave = async (result) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${API_BASE_URL}/api/mindmaps/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (result?.data?.title || title || '未命名思维导图').toString().slice(0, 80),
          content: (result?.data?.markdown || '').toString(),
          description: null,
          is_public: false,
        })
      })
      if (res.ok) {
        const saved = await res.json()
        setSavedId(saved?.id || null)
      }
    } catch {}
  }

  // 生成思维导图（文本）
  const handleGenerateFromText = useCallback(async () => {
    if (!text.trim() || submitting) return
    try {
      setSubmitting(true)
      setError(null)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const payload = { text: text.trim(), style: mapStyle }
      const res = await fetchWithRetry(`${API_BASE_URL}/api/process-text`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      }, { retries: 2 })
      
      const result = await res.json()
      if (res.ok && result.success) { 
        setPreview(result)
        await autoSave(result)
        saveToHistory(result)
        refreshUser?.() 
      } else {
        throw new Error(result?.detail?.message || result?.detail || '生成失败')
      }
    } catch (e) { 
      setError(String(e.message || e)) 
    } finally { 
      setSubmitting(false) 
    }
  }, [text, submitting, mapStyle, refreshUser])

  // 生成思维导图（上传）
  const handleGenerateFromUpload = useCallback(() => {
    try {
      const canGen = uploadRef.current?.canGenerate?.()
      if (typeof window !== 'undefined' && window.TS_DEBUG) {
        console.log('[DEBUG] 触发上传生成', { canGen, estimate, mapStyle })
      }
      if (canGen && uploadRef.current?.generate) {
        uploadRef.current.generate({ style: mapStyle })
      }
    } catch (e) {
      console.error('触发上传生成失败:', e)
    }
  }, [mapStyle])

  // 判断是否可以提交
  const canSubmit = useMemo(() => {
    const credits = user?.credits || 0
    const cost = estimate?.estimated_cost || 0
    const enough = credits >= cost || !estimate
    if (source === 'text') return Boolean(text.trim()) && enough && !submitting
    return enough && !submitting
  }, [source, text, estimate, user, submitting])

  // 折叠状态切换
  const handleToggleCollapse = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // 移动端侧边栏切换
  const handleToggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev)
  }

  // 重置状态
  const handleReset = () => {
    setError(null)
    setPreview(null)
  }

  // 应用历史记录
  const handleApplyHistory = (historyItem) => {
    setSource(historyItem.source)
    setText(historyItem.text)
    setMapStyle(historyItem.mapStyle)
    setTitle(historyItem.title)
    handleReset()
  }

  // 保存到历史记录
  const saveToHistory = (result) => {
    if (window.addCreationHistory) {
      window.addCreationHistory({
        source,
        title: result?.data?.title || title || '未命名思维导图',
        text: source === 'text' ? text : '',
        mapStyle,
        preview: result,
        estimatedCost: estimate?.estimated_cost || 0
      })
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e) => {
      // ESC 键关闭移动端侧边栏
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false)
        return
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (source === 'text' && canSubmit) {
          e.preventDefault()
          handleGenerateFromText()
        } else if (source === 'upload' && uploadRef.current?.canGenerate?.() && canSubmit) {
          e.preventDefault()
          handleGenerateFromUpload()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [source, canSubmit, mapStyle, handleGenerateFromText, handleGenerateFromUpload, mobileSidebarOpen])

  // 侧边栏内容组件
  const SidebarContent = () => (
    <div className="p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* 来源选择 */}
      <SourceSelector
        source={source}
        onSourceChange={setSource}
        collapsed={collapsed.source}
        onToggleCollapse={handleToggleCollapse}
        onReset={handleReset}
      />

      {/* 动态表单区域 */}
      {source === 'text' && (
        <TextInput
          text={text}
          onTextChange={setText}
          onEstimate={handleEstimateText}
          estimating={estimating}
        />
      )}
      
      {source === 'upload' && (
        <div className="space-y-4" aria-label="文件上传区域">
          <FileUpload 
            ref={uploadRef} 
            hideModeToggle 
            initialMode="file" 
            forceMode="file" 
            showGenerateButton={false} 
            showEstimatePanel={false} 
            onStateChange={(s) => {
              const credits = user?.credits || 0
              setEstimate(prev => prev ? { 
                ...prev, 
                estimated_cost: s.estimated_cost, 
                user_balance: credits, 
                sufficient_credits: credits >= (s.estimated_cost||0) 
              } : (s.estimated_cost ? { 
                estimated_cost: s.estimated_cost, 
                user_balance: credits, 
                sufficient_credits: credits >= (s.estimated_cost||0) 
              } : null))
            }} 
            onUploadStart={() => { 
              setError(null)
              setPreview(null) 
            }} 
            onUploadSuccess={async (res) => { 
              setPreview(res)
              await autoSave(res)
              saveToHistory(res)
            }} 
            onUploadError={(msg) => setError(msg)} 
          />
        </div>
      )}

      {/* 参数设置 */}
      <ParameterPanel
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        collapsed={collapsed.basic}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 操作区 */}
      <ActionPanel
        source={source}
        collapsed={collapsed.actions}
        onToggleCollapse={handleToggleCollapse}
        estimate={estimate}
        user={user}
        canSubmit={canSubmit}
        submitting={submitting}
        estimating={estimating}
        onGenerateText={handleGenerateFromText}
        onGenerateUpload={handleGenerateFromUpload}
        uploadRef={uploadRef}
      />

      {/* 历史记录 */}
      <HistoryPanel
        collapsed={collapsed.history}
        onToggleCollapse={handleToggleCollapse}
        onApplyHistory={handleApplyHistory}
        currentSource={source}
        currentText={text}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-50">
      {/* 移动端顶部工具栏 */}
      <div className="lg:hidden sticky top-0 z-40 bg-neutral-white border-b border-brand-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-brand-800">创建思维导图</h1>
          <button
            onClick={handleToggleMobileSidebar}
            className="p-2 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors duration-200"
            aria-label={mobileSidebarOpen ? "关闭设置面板" : "打开设置面板"}
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* 移动端遮罩层 */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 主内容区域 */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧控制面板 - 桌面端 */}
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-3">
            <div className="bg-neutral-white rounded-2xl border border-brand-200 shadow-soft overflow-hidden sticky top-8">
              <SidebarContent />
            </div>
          </aside>

          {/* 左侧控制面板 - 移动端侧边栏 */}
          <aside className={`
            lg:hidden fixed top-0 left-0 h-full w-80 bg-neutral-white z-50 
            transform transition-transform duration-300 ease-in-out
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            border-r border-brand-200 shadow-strong
          `}>
            <div className="flex items-center justify-between p-6 border-b border-brand-200">
              <h2 className="text-lg font-semibold text-brand-800">设置面板</h2>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors duration-200"
                aria-label="关闭设置面板"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </aside>

          {/* 右侧预览区 */}
          <main className="lg:col-span-9 xl:col-span-9">
            <PreviewPanel
              submitting={submitting}
              preview={preview}
              error={error}
              savedId={savedId}
              title={title}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
