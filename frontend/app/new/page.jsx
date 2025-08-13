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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：来源 + 表单 */}
          <div className="lg:col-span-1">
            <Tabs value={source} onValueChange={(v)=>{ setSource(v); setError(null); setPreview(null); }} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="text">长文本</TabsTrigger>
                <TabsTrigger value="upload">文档上传</TabsTrigger>
                <TabsTrigger value="yt" disabled>Youtube（开发中）</TabsTrigger>
                <TabsTrigger value="more" disabled>更多来源</TabsTrigger>
              </TabsList>

              {/* Text 来源 */}
              <TabsContent value="text" className="mt-3">
                <Card>
                  <CardHeader>
                    <CardTitle>长文本</CardTitle>
                    <CardDescription>粘贴你的内容，右侧预览会实时更新</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="ttitle">标题</Label>
                      <Input id="ttitle" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="请输入标题"/>
                    </div>
                    <div>
                      <Label htmlFor="tcontent">文本内容</Label>
                      <Textarea id="tcontent" rows={10} value={text} onChange={(e)=>{ setText(e.target.value); const v=e.target.value; clearTimeout(window.__est); window.__est=setTimeout(()=>handleEstimateText(v), 500) }} placeholder="在此粘贴文本..."/>
                      <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span>字符数：{text.length}</span>
                        {estimate && <span className={`${estimate.sufficient_credits? 'text-emerald-600':'text-rose-600'}`}>{estimating ? '计算中...' : `预计消耗: ${estimate.estimated_cost} 积分`}</span>}
                      </div>
                    </div>
                    <div className="sticky bottom-0 bg-white/70 backdrop-blur rounded-md border p-3 flex items-center gap-3">
                      <Button onClick={handleGenerateFromText} disabled={!canSubmit || submitting} className="flex-1">{submitting? '生成中...':'🚀 生成'}</Button>
                      {estimate && <span className="text-xs text-gray-600">余额充足：{estimate.sufficient_credits ? '是' : '否'}</span>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Upload 来源（复用组件但隐藏内部切换） */}
              <TabsContent value="upload" className="mt-3">
                <Card>
                  <CardHeader>
                    <CardTitle>上传文档</CardTitle>
                    <CardDescription>PDF/DOCX/TXT/MD/SRT，最大 10MB</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload hideModeToggle initialMode="file" forceMode="file" onUploadStart={()=>{ setError(null); setPreview(null) }} onUploadSuccess={(res)=> setPreview(res)} onUploadError={(msg)=> setError(msg)} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 右侧：预览 */}
          <div className="lg:col-span-2">
            <Card>
              {preview ? (
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">{preview.data?.title || title || '思维导图'}</h2>
                    <div className="text-xs text-gray-500">Markmap 预览</div>
                  </div>
                  <div className="h-[calc(600px-52px)]">
                    <SimpleMarkmapBasic mindmapData={preview.data} />
                  </div>
                </div>
              ) : error ? (
                <CardContent>
                  <div className="h-[600px] flex items-center justify-center border border-rose-200 bg-rose-50 rounded-lg text-rose-700 text-sm p-6">{String(error)}</div>
                </CardContent>
              ) : (
                <CardContent>
                  <div className="h-[600px] flex items-center justify-center border-2 border-dashed rounded-lg text-center text-gray-500">
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
