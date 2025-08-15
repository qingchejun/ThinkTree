/**
 * 操作区组件 - 包含积分显示、生成按钮和相关操作
 * 优化版本：增强视觉反馈和交互体验
 */
'use client'

import { Button } from '@/components/ui/Button'
import { Sparkles, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react'
import { componentPatterns, textColors } from '@/design-system/tokens/semantic'

export default function ActionPanel({
  source,
  collapsed,
  onToggleCollapse,
  estimate,
  user,
  canSubmit,
  submitting,
  estimating,
  onGenerateText,
  onGenerateUpload,
  uploadRef
}) {
  const submitBtnLabel = submitting ? '生成中...' : estimating ? '计算中...' : '🚀 生成思维导图'

  const handleGenerate = () => {
    if (source === 'text') {
      onGenerateText()
    } else if (source === 'upload' && uploadRef.current) {
      onGenerateUpload()
    }
  }

  const canGenerateUpload = uploadRef.current?.canGenerate?.() && 
    (estimate?.estimated_cost || 0) <= (user?.credits || 0) && 
    !submitting

  const estimatedCost = estimate?.estimated_cost ?? 0
  const userCredits = user?.credits ?? 0
  const hasEnoughCredits = userCredits >= estimatedCost

  return (
    <div className="border-t border-brand-200 pt-4 sticky bottom-0 bg-neutral-white">
      <button 
        onClick={() => onToggleCollapse('actions')} 
        className={`${componentPatterns.collapseButton} group`}
        role="button" 
        aria-expanded={!collapsed} 
        aria-controls="group-actions"
      >
        <span className="flex items-center gap-2">
          <span>生成设置</span>
          {estimate && (
            <span className="text-xs bg-core-100 text-core-700 px-2 py-0.5 rounded-full">
              {estimatedCost} 积分
            </span>
          )}
        </span>
        <div className="transition-transform duration-200 group-hover:scale-110">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
      
      {!collapsed && (
        <div id="group-actions" className="space-y-4 mt-4">
          {/* 积分信息卡片 */}
          <div className="bg-gradient-to-r from-brand-50 to-core-50 border border-brand-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Sparkles size={16} className="text-accent-600" />
                </div>
                <span className="font-semibold text-brand-800">积分消耗</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-brand-900">
                  {estimating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-core-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">计算中</span>
                    </div>
                  ) : (
                    `${estimatedCost} 分`
                  )}
                </div>
                <div className="text-xs text-brand-500">预计消耗</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-600">当前余额</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${hasEnoughCredits ? 'text-success-600' : 'text-error-600'}`}>
                  {userCredits} 分
                </span>
                {!hasEnoughCredits && estimate && (
                  <AlertCircle size={14} className="text-error-500" />
                )}
              </div>
            </div>

            {/* 积分余额进度条 */}
            {estimate && (
              <div className="mt-3">
                <div className="w-full bg-brand-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      hasEnoughCredits ? 'bg-success-500' : 'bg-error-500'
                    }`}
                    style={{ 
                      width: `${Math.min((userCredits / Math.max(estimatedCost, userCredits)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-brand-500 mt-1">
                  <span>消耗后余额: {Math.max(0, userCredits - estimatedCost)} 分</span>
                  {!hasEnoughCredits && (
                    <span className="text-error-600">积分不足</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 生成按钮 */}
          {source === 'text' ? (
            <Button 
              onClick={onGenerateText} 
              disabled={!canSubmit} 
              className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                canSubmit ? 'shadow-lg hover:shadow-xl transform hover:scale-[1.02]' : ''
              }`}
              aria-label="生成思维导图"
              variant="feature"
            >
              {submitting && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              )}
              {submitBtnLabel}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={handleGenerate} 
                disabled={!canGenerateUpload} 
                className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                  canGenerateUpload ? 'shadow-lg hover:shadow-xl transform hover:scale-[1.02]' : ''
                }`}
                aria-label="生成思维导图"
                variant="feature"
              >
                {submitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
                {submitBtnLabel}
              </Button>
              
              {estimate && estimate.sufficient_credits === false && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle size={16} className="text-error-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-error-700">积分不足</p>
                    <p className="text-xs text-error-600 mt-1">
                      请前往邀请好友或充值后再试
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 快捷键提示 */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-xs text-brand-400 bg-brand-50 px-3 py-2 rounded-lg">
              <Zap size={12} />
              <span>快捷键:</span>
              <kbd className="bg-brand-100 px-1.5 py-0.5 rounded text-brand-600 font-mono">⌘</kbd>
              <span>+</span>
              <kbd className="bg-brand-100 px-1.5 py-0.5 rounded text-brand-600 font-mono">Enter</kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
