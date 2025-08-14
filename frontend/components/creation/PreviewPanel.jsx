/**
 * 预览区组件 - 显示思维导图预览、加载状态和错误信息
 */
'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import SimpleMarkmapBasic from '@/components/mindmap/SimpleMarkmapBasic'
import { textColors } from '@/design-system/tokens/semantic'

export default function PreviewPanel({
  submitting,
  preview,
  error,
  savedId,
  title
}) {
  const router = useRouter()

  // 加载状态
  if (submitting) {
    return (
      <Card className="h-[calc(100vh-140px)]">
        <CardContent className="h-full">
          <div className="h-full p-6 animate-pulse">
            <div className="h-5 w-40 bg-brand-200 rounded mb-4"></div>
            <div className="h-8 w-full bg-brand-100 rounded mb-3"></div>
            <div className="h-[calc(100%-60px)] w-full bg-brand-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 预览状态
  if (preview) {
    return (
      <Card className="h-[calc(100vh-140px)]">
        <div className="h-full rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-brand-200">
            <h2 className="text-base font-semibold text-brand-800">
              {preview.data?.title || title || '思维导图'}
              {savedId && (
                <span className="ml-2 text-xs text-success-600">已自动保存</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {savedId && (
                <Button 
                  size="sm" 
                  onClick={() => router.push(`/mindmap/${savedId}`)} 
                  aria-label="查看导图详情"
                  variant="secondary"
                >
                  查看详情
                </Button>
              )}
              <div className="text-xs text-brand-500">Markmap 预览</div>
            </div>
          </div>
          <div className="h-[calc(100%-44px)]">
            <SimpleMarkmapBasic mindmapData={preview.data} />
          </div>
        </div>
      </Card>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className="h-[calc(100vh-140px)]">
        <CardContent className="h-full">
          <div className="h-full flex items-center justify-center border border-error-200 bg-error-50 rounded-lg text-error-700 text-sm p-6">
            {String(error)}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 空状态
  return (
    <Card className="h-[calc(100vh-140px)]">
      <CardContent className="h-full">
        <div className="h-full flex items-center justify-center border-2 border-dashed border-brand-200 rounded-lg text-center text-brand-500">
          <div>
            <div className="text-5xl mb-3">🌳</div>
            <div className="text-sm">选择来源并填写内容，点击左下角"生成"后在这里预览</div>
            <div className="text-xs mt-2 text-brand-400">
              小提示：可展开/折叠左侧分组，系统会记住你的偏好
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
