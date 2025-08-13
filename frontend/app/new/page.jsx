/**
 * /new 页面重构骨架（方案一 + 可扩展增强）
 * 左侧：来源分段（文本/上传 + 开发中占位） + 动态表单 + 吸附CTA
 * 右侧：预览空态/加载/导图
 */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import FileUpload from '@/components/upload/FileUpload'
import SimpleMarkmapBasic from '@/components/mindmap/SimpleMarkmapBasic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

export default function NewPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [source, setSource] = useState('text') // text | upload
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null) // { data: { title, markdown } }
  const [error, setError] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // 基础/高级参数（占位，后续接入）
  const [language, setLanguage] = useState('auto')
  const [depth, setDepth] = useState('medium') // simple/medium/deep
  const [style, setStyle] = useState('general')

  useEffect(() => {
    if (!isLoading && !user) router.push('/?auth=login')
  }, [user, isLoading, router])

  const canSubmit = useMemo(() => {
    if (source === 'text') return Boolean(text.trim()) && (!estimate || estimate?.sufficient_credits !== false)
    return true
  }, [source, text, estimate])

  const handleEstimateText = async (val) => {
    if (!val.trim()) { setEstimate(null); return }
    try {
      setEstimating(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${API_BASE_URL}/api/estimate-credit-cost`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: val.trim() })
      })
      if (res.ok) setEstimate(await res.json()); else setEstimate(null)
    } catch { setEstimate(null) } finally { setEstimating(false) }
  }

  // 生成（文本）
  const handleGenerateFromText = async () => {
    if (!text.trim()) return
    try {
      setSubmitting(true); setError(null)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${API_BASE_URL}/api/process-text`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim() }) })
      const result = await res.json()
      if (res.ok && result.success) setPreview(result)
      else throw new Error(result?.detail?.message || result?.detail || '生成失败')
    } catch (e) { setError(String(e.message || e)) } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* 左侧侧栏 */}
          <aside className="w-[380px] shrink-0 bg-white rounded-xl border border-gray-200 p-4 h-[calc(100vh-160px)] overflow-auto">
            {/* 来源（Accordion 风格） */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">来源</div>
              <div className="space-y-2">
                {[
                  { key: 'text', label: '长文本' },
                  { key: 'upload', label: '文档上传' },
                  { key: 'yt', label: 'YouTube（开发中）', disabled: true },
                  { key: 'pod', label: '播客（开发中）', disabled: true },
                  { key: 'audio', label: '音频文件（开发中）', disabled: true },
                  { key: 'web', label: '网页链接（开发中）', disabled: true },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={()=>{ if(item.disabled) return; setSource(item.key); setError(null); setPreview(null); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${source===item.key? 'border-black bg-gray-900 text-white':'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'} ${item.disabled? 'opacity-50 cursor-not-allowed':''}`}
                    aria-expanded={source===item.key}
                    aria-disabled={item.disabled}
                  >
                    <span>{item.label}</span>
                    <span>{source===item.key? '−':'+'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 来源子表单 */}
            {source === 'text' && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="ttitle">标题</Label>
                  <Input id="ttitle" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="请输入标题"/>
                </div>
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
              <div className="mt-3">
                <FileUpload hideModeToggle initialMode="file" forceMode="file" onUploadStart={()=>{ setError(null); setPreview(null) }} onUploadSuccess={(res)=> setPreview(res)} onUploadError={(msg)=> setError(msg)} />
              </div>
            )}

            {/* 基础参数 */}
            <div className="mt-6">
              <div className="text-sm font-semibold text-gray-700 mb-2">基础参数</div>
              <div className="space-y-3 text-sm">
                <div>
                  <Label>语言</Label>
                  <select value={language} onChange={(e)=>setLanguage(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1">
                    <option value="auto">自动</option>
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <Label>大纲深度</Label>
                  <select value={depth} onChange={(e)=>setDepth(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1">
                    <option value="simple">简略</option>
                    <option value="medium">中等</option>
                    <option value="deep">详细</option>
                  </select>
                </div>
                <div>
                  <Label>风格</Label>
                  <select value={style} onChange={(e)=>setStyle(e.target.value)} className="mt-1 w-full border rounded-md px-2 py-1">
                    <option value="general">通用</option>
                    <option value="edu">教学</option>
                    <option value="academic">学术</option>
                    <option value="product">产品</option>
                    <option value="plan">计划</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 高级参数（占位） */}
            <div className="mt-6">
              <div className="text-sm font-semibold text-gray-700 mb-2">高级参数</div>
              <div className="text-xs text-gray-500">更多可选项将在下一步接入</div>
            </div>

            {/* 操作区 */}
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                <span>预计消耗：{estimate? estimate.estimated_cost : '--'} 分</span>
                {estimate && <span>余额{estimate.user_balance}分</span>}
              </div>
              <Button onClick={handleGenerateFromText} disabled={source!=='text' || !canSubmit || submitting} className="w-full">{submitting? '生成中...' : '🚀 生成'}</Button>
              {source==='upload' && (
                <div className="mt-2 text-[11px] text-gray-500">在上方解析并生成，结果将自动在右侧展示</div>
              )}
            </div>
          </aside>

          {/* 中线分界 + 右侧预览 */}
          <div className="flex-1 border-l border-gray-200 pl-6">
            <Card className="h-[calc(100vh-160px)]">
              {preview ? (
                <div className="h-full rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">{preview.data?.title || title || '思维导图'}</h2>
                    <div className="text-xs text-gray-500">Markmap 预览</div>
                  </div>
                  <div className="h-[calc(100%-52px)]">
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
                      <div className="text-sm">选择来源并填写内容，生成后在这里预览</div>
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
