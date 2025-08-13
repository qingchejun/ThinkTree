/**
 * 新建思维导图页面 - 重构版本
 * 采用组件化架构，提升可维护性和开发效率
 */
'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/context/ModalContext'
import FileUpload from '@/components/upload/FileUpload'

// 导入新的子组件
import {
  SourceSelector,
  TextInput,
  ParameterPanel,
  ActionPanel,
  PreviewPanel
} from '@/components/creation'

export default function NewPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const { openLoginModal } = useModal?.() || { openLoginModal: null }
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
    actions: false 
  })

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
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { 
      localStorage.setItem('thinkso:new-page:collapsed', JSON.stringify(collapsed)) 
    } catch {}
  }, [collapsed])

  // URL参数处理
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const src = (params.get('source') || '').toLowerCase()
      const sty = (params.get('style') || '').toLowerCase()
      if (src === 'upload' || src === 'text') setSource(src)
      if (sty === 'refined' || sty === 'original') setMapStyle(sty)
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
        autoSave(result)
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
    if (uploadRef.current?.generate) {
      uploadRef.current.generate({ style: mapStyle })
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

  // 重置状态
  const handleReset = () => {
    setError(null)
    setPreview(null)
  }

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e) => {
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
  }, [source, canSubmit, mapStyle, handleGenerateFromText, handleGenerateFromUpload])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1280px] mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* 左侧侧栏 */}
          <aside className="w-[320px] shrink-0 bg-white rounded-xl border border-gray-200 p-4 h-[calc(100vh-160px)] overflow-auto" aria-label="新建导图设置侧栏">
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
              <div className="mt-3" aria-label="文件上传区域">
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
                  onUploadSuccess={(res) => { 
                    setPreview(res)
                    autoSave(res) 
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
          </aside>

          {/* 右侧预览区 */}
          <div className="flex-1 border-l border-gray-200 pl-8">
            <PreviewPanel
              submitting={submitting}
              preview={preview}
              error={error}
              savedId={savedId}
              title={title}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
