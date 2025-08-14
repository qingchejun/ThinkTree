/**
 * 文本输入组件 - 支持长文本输入和实时字符统计
 */
'use client'

import { useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { HelperText } from '@/components/ui/Form'
import { textColors } from '@/design-system/tokens/semantic'

const MAX_TEXT_LEN = 100000

export default function TextInput({ 
  text, 
  onTextChange, 
  onEstimate,
  estimating 
}) {
  const estimateTimeoutRef = useRef(null)

  // 处理文本变化和自动估算
  const handleTextChange = (e) => {
    const newText = e.target.value
    onTextChange(newText)
    
    // 防抖估算
    if (estimateTimeoutRef.current) {
      clearTimeout(estimateTimeoutRef.current)
    }
    
    estimateTimeoutRef.current = setTimeout(() => {
      if (onEstimate) {
        onEstimate(newText)
      }
    }, 500)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="mt-3 space-y-3" aria-label="长文本输入">
      <div>
        <Label htmlFor="tcontent" tone="default">文本内容</Label>
        <Textarea 
          id="tcontent" 
          rows={8} 
          value={text} 
          onChange={handleTextChange}
          placeholder="在此粘贴文本..."
          status={text.length > MAX_TEXT_LEN ? 'error' : 'default'}
          className={estimating ? 'opacity-75' : ''}
        />
        {estimating ? (
          <div className="mt-1 flex justify-between">
            <HelperText tone="info">估算中…</HelperText>
            <span className="text-xs text-brand-500">字符数：{text.length}</span>
          </div>
        ) : (
          <div className="mt-1 flex justify-between text-xs text-brand-500">
            <span>字符数：{text.length}</span>
            {text.length > MAX_TEXT_LEN && (
              <span className={textColors.error}>
                超出限制 ({text.length - MAX_TEXT_LEN} 字符)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
