/**
 * 参数设置组件 - 支持导图风格等基础参数配置
 */
'use client'

import { Label } from '@/components/ui/Label'
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
            <Label className="text-brand-700">导图风格</Label>
            <select 
              value={mapStyle} 
              onChange={(e) => onMapStyleChange(e.target.value)} 
              className="mt-1 w-full border border-brand-200 rounded-md px-2 py-1 bg-neutral-white text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors duration-200"
            >
              {STYLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-brand-500">
              {mapStyle === 'original' ? '保持原始结构和细节' : '精炼关键信息，突出重点'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
