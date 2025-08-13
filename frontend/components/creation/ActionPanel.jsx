/**
 * 操作区组件 - 包含积分显示、生成按钮和相关操作
 */
'use client'

import { Button } from '@/components/ui/Button'
import { Sparkles } from 'lucide-react'

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
  const submitBtnLabel = submitting ? '生成中...' : estimating ? '生成（计算中…）' : '🚀 生成'

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

  return (
    <div className="mt-6 border-t pt-2 sticky bottom-0 bg-white">
      <button 
        onClick={() => onToggleCollapse('actions')} 
        className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-800 mb-2" 
        role="button" 
        aria-expanded={!collapsed} 
        aria-controls="group-actions"
      >
        <span>操作区</span>
        <span aria-hidden>{collapsed ? '+' : '−'}</span>
      </button>
      
      {!collapsed && (
        <div id="group-actions">
          {/* 积分信息 */}
          <div className="flex items-center justify-end text-[11px] text-gray-600 mb-2 gap-3" aria-live="polite">
            <span className="inline-flex items-center gap-1">
              <Sparkles size={12} /> 
              预计{estimate && estimate.estimated_cost != null ? estimate.estimated_cost : '--'}分
            </span>
            <span>余额{user?.credits ?? '--'}分</span>
          </div>

          {/* 生成按钮 */}
          {source === 'text' ? (
            <Button 
              onClick={onGenerateText} 
              disabled={!canSubmit} 
              className="w-full" 
              aria-label="生成思维导图"
            >
              {submitBtnLabel}
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleGenerate} 
                disabled={!canGenerateUpload} 
                className="w-full" 
                aria-label="生成思维导图"
              >
                {submitBtnLabel}
              </Button>
              {estimate && estimate.sufficient_credits === false && (
                <div className="mt-2 text-[11px] text-rose-600">
                  积分不足，请前往邀请/充值后再试
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
