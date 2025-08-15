/**
 * 预览区组件 - 显示思维导图预览、加载状态和错误信息
 * 优化版本：增强空状态引导和视觉效果
 */
'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import SimpleMarkmapBasic from '@/components/mindmap/SimpleMarkmapBasic'
import Logo from '@/components/common/Logo'
import { textColors } from '@/design-system/tokens/semantic'
import { Sparkles, FileText, Upload, Zap, ArrowRight } from 'lucide-react'

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
      <Card className="h-[calc(100vh-140px)] shadow-soft">
        <CardContent className="h-full">
          <div className="h-full p-8">
            {/* 加载动画 */}
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-core-600 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Logo />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-48 bg-brand-200 rounded animate-pulse mx-auto"></div>
                  <div className="h-3 w-32 bg-brand-100 rounded animate-pulse mx-auto"></div>
                </div>
                <p className="text-brand-600 mt-6 font-medium">AI 正在生成思维导图...</p>
                <p className="text-brand-400 text-sm mt-2">这通常需要几秒钟时间</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 预览状态
  if (preview) {
    return (
      <Card className="h-[calc(100vh-140px)] shadow-soft">
        <div className="h-full rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-brand-200 bg-gradient-to-r from-brand-50 to-core-50">
            <h2 className="text-base font-semibold text-brand-800">
              {preview.data?.title || title || '思维导图'}
              {savedId && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-success-600 bg-success-50 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                  已自动保存
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              {savedId && (
                <Button 
                  size="sm" 
                  onClick={() => router.push(`/mindmap/${savedId}`)} 
                  aria-label="查看导图详情"
                  variant="feature"
                  className="shadow-sm"
                >
                  查看详情
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              )}
              <div className="text-xs text-brand-500 bg-brand-100 px-2 py-1 rounded">
                Markmap 预览
              </div>
            </div>
          </div>
          <div className="h-[calc(100%-60px)]">
            <SimpleMarkmapBasic mindmapData={preview.data} />
          </div>
        </div>
      </Card>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className="h-[calc(100vh-140px)] shadow-soft">
        <CardContent className="h-full">
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} className="text-error-600" />
                </div>
                <h3 className="text-lg font-semibold text-error-700 mb-2">生成失败</h3>
                <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm">
                  {String(error)}
                </div>
              </div>
              <p className="text-brand-500 text-sm">
                请检查输入内容或稍后重试
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 空状态 - 增强版引导界面
  return (
    <Card className="h-[calc(100vh-140px)] shadow-soft">
      <CardContent className="h-full">
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-lg">
            {/* Logo 动画 */}
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-core-100 to-collaboration-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <div className="scale-150 opacity-80">
                    <Logo />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles size={14} className="text-white" />
                </div>
              </div>
            </div>

            {/* 主要引导文案 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-brand-900 mb-3">
                开始创建你的思维导图
              </h2>
              <p className="text-brand-600 text-lg leading-relaxed">
                选择输入方式，填写内容，让 AI 为你生成专业的思维导图
              </p>
            </div>

            {/* 功能特色展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-core-50 border border-core-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-core-100 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-core-600" />
                  </div>
                  <h3 className="font-semibold text-brand-800">文本输入</h3>
                </div>
                <p className="text-sm text-brand-600">
                  直接输入文本内容，AI 智能分析结构
                </p>
              </div>

              <div className="bg-content-50 border border-content-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-content-100 rounded-lg flex items-center justify-center">
                    <Upload size={16} className="text-content-600" />
                  </div>
                  <h3 className="font-semibold text-brand-800">文档上传</h3>
                </div>
                <p className="text-sm text-brand-600">
                  支持多种格式，自动提取关键信息
                </p>
              </div>
            </div>

            {/* 操作提示 */}
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-6">
              <div className="flex items-center justify-center gap-2 text-brand-600 mb-2">
                <Sparkles size={16} className="text-accent-600" />
                <span className="font-medium">快速开始</span>
              </div>
              <p className="text-sm text-brand-500 leading-relaxed">
                在左侧面板选择输入方式，填写内容后点击"生成"按钮，
                <br />
                你的思维导图将在这里显示
              </p>
            </div>

            {/* 键盘快捷键提示 */}
            <div className="mt-6 text-xs text-brand-400">
              <span className="inline-flex items-center gap-1 bg-brand-100 px-2 py-1 rounded">
                <kbd className="font-mono">⌘</kbd> + <kbd className="font-mono">Enter</kbd>
              </span>
              <span className="ml-2">快速生成</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
