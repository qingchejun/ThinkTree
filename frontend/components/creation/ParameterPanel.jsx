/**
 * 参数设置组件 - 支持导图风格等基础参数配置
 */
'use client'

import { Label } from '@/components/ui/Label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { HelperText } from '@/components/ui/Form'
import { componentPatterns } from '@/design-system/tokens/semantic'

const STYLE_OPTIONS = [
  { value: 'original', label: '原始' },
  { value: 'refined', label: '精炼' }
]

export default function ParameterPanel({ 
  mapStyle, 
  onMapStyleChange, 
  collapsed, 
  onToggleCollapse 
}) {
  return (
    <div className="mt-6">
      <button 
        onClick={() => onToggleCollapse('basic')} 
        className={componentPatterns.collapseButton}
        role="button" 
        aria-expanded={!collapsed} 
        aria-controls="group-basic"
      >
        <span>基础参数</span>
        <span aria-hidden>{collapsed ? '+' : '−'}</span>
      </button>
      
      {!collapsed && (
        <div id="group-basic" className="space-y-3 text-sm">
          <div>
            <Label tone="default">导图风格</Label>
            <div className="mt-1">
              <Select value={mapStyle} onValueChange={onMapStyleChange}>
                <SelectTrigger size="sm" status="default">
                  <SelectValue placeholder="选择风格" />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <HelperText tone="muted" >{mapStyle === 'original' ? '保持原始结构和细节' : '精炼关键信息，突出重点'}</HelperText>
          </div>
        </div>
      )}
    </div>
  )
}
