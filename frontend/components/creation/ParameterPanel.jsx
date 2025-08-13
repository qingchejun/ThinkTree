/**
 * 参数设置组件 - 支持导图风格等基础参数配置
 */
'use client'

import { Label } from '@/components/ui/Label'

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
        className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-800 mb-2" 
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
            <Label>导图风格</Label>
            <select 
              value={mapStyle} 
              onChange={(e) => onMapStyleChange(e.target.value)} 
              className="mt-1 w-full border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STYLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              {mapStyle === 'original' ? '保持原始结构和细节' : '精炼关键信息，突出重点'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
