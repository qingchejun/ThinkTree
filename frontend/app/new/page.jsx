/**
 * /new 页面重构骨架（方案一 + 可扩展增强）
 * 左侧：来源分段（文本/上传 + 开发中占位） + 动态表单 + 吸附CTA
 * 右侧：预览空态/加载/导图
 */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/context/ModalContext'
import FileUpload from '@/components/upload/FileUpload'
import { useRef } from 'react'
import SimpleMarkmapBasic from '@/components/mindmap/SimpleMarkmapBasic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { FileText, Upload, Youtube, Mic, AudioLines, Globe } from 'lucide-react'

export default function NewPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const { openLoginModal } = useModal?.() || { openLoginModal: null }
  const router = useRouter()

  const [source, setSource] = useState('text') // text | upload
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null) // { data: { title, markdown } }
  const [error, setError] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [retrySignal, setRetrySignal] = useState(0)
  const estimateAbortRef = useRef(null)
  const uploadRef = useRef(null)
  // 基础/高级参数（占位，后续接入）
  // const [language, setLanguage] = useState('auto') // 暂时隐藏
  // 导图风格：original | refined
  const [mapStyle, setMapStyle] = useState('original')
  const [savedId, setSavedId] = useState(null)
  // 折叠状态（持久化到 localStorage）
  const [collapsed, setCollapsed] = useState({ source: false, basic: false, advanced: false, actions: false })

  // 读取折叠状态
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

  // 持久化折叠状态
  useEffect(() => {
    try { localStorage.setItem('thinkso:new-page:collapsed', JSON.stringify(collapsed)) } catch {}
  }, [collapsed])

  useEffect(() => {
    if (!isLoading && !user) router.push('/?auth=login')
  }, [user, isLoading, router])

  const canSubmit = useMemo(() => {
    const credits = user?.credits || 0
    const cost = estimate?.estimated_cost || 0
    const enough = credits >= cost || !estimate
    if (source === 'text') return Boolean(text.trim()) && enough && !submitting
    // 上传路径：根据估算与可生成状态综合判断（估算缺失时不拦截，由 uploadRef.canGenerate 控制）
    return enough && !submitting
  }, [source, text, estimate, user, submitting])

  // 通用 fetch 带重试与401触发登录
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

  const handleEstimateText = async (val) => {
    if (estimateAbortRef.current) { try { estimateAbortRef.current.abort() } catch {} }
    if (!val.trim()) { setEstimate(null); return }
    try {
      setEstimating(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const controller = new AbortController()
      estimateAbortRef.current = controller
      const res = await fetchWithRetry(`${API_BASE_URL}/api/estimate-credit-cost`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: val.trim() }), signal: controller.signal
      }, { retries: 2 })
      if (res.ok) setEstimate(await res.json()); else setEstimate(null)
    } catch { setEstimate(null) } finally { setEstimating(false); estimateAbortRef.current = null }
  }

  // 自动保存到「我的导图」
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

  // 生成（文本）
  const handleGenerateFromText = async () => {
    if (!text.trim() || submitting) return
    try {
      setSubmitting(true); setError(null)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      // 仅传入导图风格，由后端集中管理 refined 提示词
      const payload = { text: text.trim(), style: mapStyle }
      const res = await fetchWithRetry(`${API_BASE_URL}/api/process-text`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, { retries: 2 })
      const result = await res.json()
      if (res.ok && result.success) { setPreview(result); autoSave(result); refreshUser?.() }
      else throw new Error(result?.detail?.message || result?.detail || '生成失败')
    } catch (e) { setError(String(e.message || e)) } finally { setSubmitting(false) }
  }

  const submitBtnLabel = useMemo(() => {
    if (submitting) return '生成中...'
    if (estimating) return '生成（计算中…）'
    if (estimate?.estimated_cost != null) return `生成（预计${estimate.estimated_cost}分）`
    return '🚀 生成'
  }, [submitting, estimating, estimate])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* 左侧侧栏 */}
          <aside className="w-[340px] shrink-0 bg-white rounded-xl border border-gray-200 p-3 h-[calc(100vh-160px)] overflow-auto" aria-label="新建导图设置侧栏">
            {/* 来源（可折叠） */}
            <div className="mb-4">
              <button onClick={()=>setCollapsed(v=>({...v, source: !v.source}))} className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-700 mb-1" role="button" aria-expanded={!collapsed.source} aria-controls="group-source">
                <span>来源</span>
                <span aria-hidden>{collapsed.source? '+' : '−'}</span>
              </button>
              {!collapsed.source && (
              <div id="group-source" className="space-y-2">
                {[
                  { key: 'text', label: '长文本', Icon: FileText },
                  { key: 'upload', label: '文档上传', Icon: Upload },
                  { key: 'yt', label: 'YouTube（开发中）', Icon: Youtube, disabled: true },
                  { key: 'pod', label: '播客（开发中）', Icon: Mic, disabled: true },
                  { key: 'audio', label: '音频文件（开发中）', Icon: AudioLines, disabled: true },
                  { key: 'web', label: '网页链接（开发中）', Icon: Globe, disabled: true },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={()=>{ if(item.disabled) return; setSource(item.key); setError(null); setPreview(null); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${source===item.key? 'border-black bg-gray-900 text-white':'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'} ${item.disabled? 'opacity-50 cursor-not-allowed':''}`}
                    aria-expanded={source===item.key}
                    aria-disabled={item.disabled}
                  >
                    <span className="flex items-center gap-2">
                      {item.Icon && <item.Icon size={16} className={source===item.key? 'text-white':'text-gray-600'} />}
                      {item.label}
                    </span>
                    <span>{source===item.key? '−':'+'}</span>
                  </button>
                ))}
              </div>
              )}
            </div>

            {/* 来源子表单 */}
            {source === 'text' && (
              <div className="mt-3 space-y-3" aria-label="长文本输入">
                <div>
                  <Label htmlFor="tcontent">文本内容</Label>
                  <Textarea id="tcontent" rows={8} value={text} onChange={(e)=>{ setText(e.target.value); const v=e.target.value; clearTimeout(window.__est); window.__est=setTimeout(()=>handleEstimateText(v), 500) }} placeholder="在此粘贴文本..."/>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>字符数：{text.length}</span>
                    {estimate && <span className={`${estimate.sufficient_credits? 'text-emerald-600':'text-rose-600'}`}>{estimating ? '计算中...' : `预计消耗: ${estimate.estimated_cost} 积分`}</span>}
                  </div>
                </div>
              </div>
            )}
            {source === 'upload' && (
              <div className="mt-3" aria-label="文件上传区域">
                <FileUpload ref={uploadRef} hideModeToggle initialMode="file" forceMode="file" showGenerateButton={false} showEstimatePanel={false} onStateChange={(s)=>{
                  const credits = user?.credits || 0
                  setEstimate(prev => prev ? { ...prev, estimated_cost: s.estimated_cost, user_balance: credits, sufficient_credits: credits >= (s.estimated_cost||0) } : (s.estimated_cost? { estimated_cost: s.estimated_cost, user_balance: credits, sufficient_credits: credits >= (s.estimated_cost||0) } : null))
                }} onUploadStart={()=>{ setError(null); setPreview(null) }} onUploadSuccess={(res)=> { setPreview(res); autoSave(res) }} onUploadError={(msg)=> setError(msg)} />
              </div>
            )}

            {/* 基础参数（可折叠） */}
            <div className="mt-6">
              <button onClick={()=>setCollapsed(v=>({...v, basic: !v.basic}))} className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-700 mb-2" role="button" aria-expanded={!collapsed.basic} aria-controls="group-basic">
                <span>基础参数</span>
                <span aria-hidden>{collapsed.basic? '+' : '−'}</span>
              </button>
              {!collapsed.basic && (
              <div id="group-basic" className="space-y-3 text-sm">
                <div>
                  <Label>导图风格</Label>
                  <select value={mapStyle} onChange={(e)=>setMapStyle(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1">
                    <option value="original">原始</option>
                    <option value="refined">精炼</option>
                  </select>
                </div>
              </div>
              )}
            </div>

            {/* 高级参数（可折叠，占位） */}
            <div className="mt-6">
              <button onClick={()=>setCollapsed(v=>({...v, advanced: !v.advanced}))} className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-700 mb-2" role="button" aria-expanded={!collapsed.advanced} aria-controls="group-advanced">
                <span>高级参数</span>
                <span aria-hidden>{collapsed.advanced? '+' : '−'}</span>
              </button>
              {!collapsed.advanced && (
              <div id="group-advanced" className="text-xs text-gray-500">更多可选项将在下一步接入</div>
              )}
            </div>

            {/* 操作区（可折叠，sticky 固钉到底部） */}
            <div className="mt-6 border-t pt-2 sticky bottom-0 bg-white">
              <button onClick={()=>setCollapsed(v=>({...v, actions: !v.actions}))} className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-700 mb-2" role="button" aria-expanded={!collapsed.actions} aria-controls="group-actions">
                <span>操作区</span>
                <span aria-hidden>{collapsed.actions? '+' : '−'}</span>
              </button>
              {!collapsed.actions && (
              <div id="group-actions">
                <div className="flex items-center justify-between text-[11px] text-gray-600 mb-2" aria-live="polite">
                  <span>预计消耗：{estimate? estimate.estimated_cost : '--'} 分</span>
                  <span>余额{user?.credits ?? '--'}分</span>
                </div>
                {source==='text' ? (
                  <Button onClick={handleGenerateFromText} disabled={!canSubmit} className="w-full" aria-label="生成思维导图">{submitBtnLabel}</Button>
                ) : (
                  <>
                    <Button onClick={()=> uploadRef.current?.generate({ style: mapStyle })} disabled={!uploadRef.current || !uploadRef.current?.canGenerate?.() || (estimate?.estimated_cost || 0) > (user?.credits || 0) || submitting} className="w-full" aria-label="生成思维导图">{submitBtnLabel}</Button>
                    {estimate && estimate.sufficient_credits === false && (
                      <div className="mt-2 text-[11px] text-rose-600">积分不足，请前往邀请/充值后再试</div>
                    )}
                    <div className="mt-2 text-[11px] text-gray-400">
                      <button className="underline" onClick={()=> setRetrySignal(x=>x+1)}>重试</button>
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          </aside>

          {/* 中线分界 + 右侧预览 */}
          <div className="flex-1 border-l border-gray-200 pl-6">
            <Card className="h-[calc(100vh-140px)]">
              {submitting ? (
                <CardContent className="h-full">
                  <div className="h-full p-6 animate-pulse">
                    <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 w-full bg-gray-100 rounded mb-3"></div>
                    <div className="h-[calc(100%-60px)] w-full bg-gray-100 rounded"></div>
                  </div>
                </CardContent>
              ) : preview ? (
                <div className="h-full rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-base font-semibold">{preview.data?.title || title || '思维导图'}{savedId && <span className="ml-2 text-xs text-emerald-600">已自动保存</span>}</h2>
                    <div className="flex items-center gap-2">
                      {savedId && (
                        <>
                          <Button size="sm" variant="outline" onClick={()=>window.open(`/mindmap/${savedId}`, '_blank')} aria-label="在新标签打开导图">打开导图</Button>
                          <Button size="sm" onClick={()=>router.push(`/mindmap/${savedId}`)} aria-label="查看导图详情">查看详情</Button>
                        </>
                      )}
                      <div className="text-xs text-gray-500">Markmap 预览</div>
                    </div>
                  </div>
                  <div className="h-[calc(100%-44px)]">
                    <SimpleMarkmapBasic mindmapData={preview.data} />
                  </div>
                </div>
              ) : error ? (
                <CardContent className="h-full">
                  <div className="h-full flex items-center justify-center border border-rose-200 bg-rose-50 rounded-lg text-rose-700 text-sm p-6">{String(error)}</div>
                </CardContent>
              ) : (
                <CardContent className="h-full">
                  <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg text-center text-gray-500">
                    <div>
                      <div className="text-5xl mb-3">🌳</div>
                      <div className="text-sm">选择来源并填写内容，点击左下角“生成”后在这里预览</div>
                      <div className="text-xs mt-2 text-gray-400">小提示：可展开/折叠左侧分组，系统会记住你的偏好</div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
