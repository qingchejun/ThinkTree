/**
 * 来源选择组件 - 支持文本输入、文件上传等多种来源
 */
'use client'

import { useState } from 'react'
import { FileText, Upload, Youtube, Mic, AudioLines, Globe } from 'lucide-react'

const SOURCE_OPTIONS = [
  { key: 'text', label: '长文本', Icon: FileText },
  { key: 'upload', label: '文档上传', Icon: Upload },
  { key: 'yt', label: 'YouTube（开发中）', Icon: Youtube, disabled: true },
  { key: 'pod', label: '播客（开发中）', Icon: Mic, disabled: true },
  { key: 'audio', label: '音频文件（开发中）', Icon: AudioLines, disabled: true },
  { key: 'web', label: '网页链接（开发中）', Icon: Globe, disabled: true },
]

export default function SourceSelector({ 
  source, 
  onSourceChange, 
  collapsed, 
  onToggleCollapse,
  onReset 
}) {
  const handleSourceChange = (newSource) => {
    if (SOURCE_OPTIONS.find(opt => opt.key === newSource)?.disabled) return
    onSourceChange(newSource)
    onReset?.() // 重置错误和预览状态
  }

  return (
    <div className="mb-4">
      <button 
        onClick={() => onToggleCollapse('source')} 
        className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-800 mb-2" 
        role="button" 
        aria-expanded={!collapsed} 
        aria-controls="group-source"
      >
        <span>来源</span>
        <span aria-hidden>{collapsed ? '+' : '−'}</span>
      </button>
      
      {!collapsed && (
        <div id="group-source" className="space-y-2">
          {SOURCE_OPTIONS.map(item => (
            <button
              key={item.key}
              onClick={() => handleSourceChange(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                source === item.key 
                  ? 'border-black bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-expanded={source === item.key}
              aria-disabled={item.disabled}
            >
              <span className="flex items-center gap-2">
                {item.Icon && (
                  <item.Icon 
                    size={16} 
                    className={source === item.key ? 'text-white' : 'text-gray-600'} 
                  />
                )}
                {item.label}
              </span>
              <span>{source === item.key ? '−' : '+'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
