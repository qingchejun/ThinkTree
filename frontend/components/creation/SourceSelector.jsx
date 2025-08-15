/**
 * 来源选择组件 - 支持文本输入、文件上传等多种来源
 * 优化版本：增强交互体验和视觉反馈
 */
'use client'

import { useState } from 'react'
import { FileText, Upload, Youtube, Mic, AudioLines, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { componentPatterns } from '@/design-system/tokens/semantic'

const SOURCE_OPTIONS = [
  { 
    key: 'text', 
    label: '长文本', 
    Icon: FileText, 
    description: '直接输入或粘贴文本内容',
    color: 'core'
  },
  { 
    key: 'upload', 
    label: '文档上传', 
    Icon: Upload, 
    description: '支持 PDF、Word、TXT 等格式',
    color: 'content'
  },
  { 
    key: 'yt', 
    label: 'YouTube', 
    Icon: Youtube, 
    description: '从视频链接提取内容（即将推出）',
    disabled: true,
    color: 'collaboration'
  },
  { 
    key: 'pod', 
    label: '播客', 
    Icon: Mic, 
    description: '播客音频转文字分析（即将推出）',
    disabled: true,
    color: 'collaboration'
  },
  { 
    key: 'audio', 
    label: '音频文件', 
    Icon: AudioLines, 
    description: '上传音频文件转换（即将推出）',
    disabled: true,
    color: 'collaboration'
  },
  { 
    key: 'web', 
    label: '网页链接', 
    Icon: Globe, 
    description: '从网页提取内容（即将推出）',
    disabled: true,
    color: 'collaboration'
  },
]

export default function SourceSelector({ 
  source, 
  onSourceChange, 
  collapsed, 
  onToggleCollapse,
  onReset 
}) {
  const [hoveredItem, setHoveredItem] = useState(null)

  const handleSourceChange = (newSource) => {
    if (SOURCE_OPTIONS.find(opt => opt.key === newSource)?.disabled) return
    onSourceChange(newSource)
    onReset?.() // 重置错误和预览状态
  }

  const getColorClasses = (item, isSelected) => {
    if (item.disabled) {
      return {
        container: 'border-brand-100 bg-brand-50 text-brand-400 cursor-not-allowed',
        icon: 'text-brand-300',
        badge: 'bg-brand-100 text-brand-400'
      }
    }

    if (isSelected) {
      const colorMap = {
        core: 'border-core-500 bg-core-600 text-white shadow-core-500/20',
        content: 'border-content-500 bg-content-600 text-white shadow-content-500/20',
        collaboration: 'border-collaboration-500 bg-collaboration-600 text-white shadow-collaboration-500/20'
      }
      return {
        container: `${colorMap[item.color]} shadow-lg`,
        icon: 'text-white',
        badge: 'bg-white/20 text-white'
      }
    }

    const colorMap = {
      core: 'border-core-200 bg-core-50 text-core-800 hover:bg-core-100 hover:border-core-300',
      content: 'border-content-200 bg-content-50 text-content-800 hover:bg-content-100 hover:border-content-300',
      collaboration: 'border-collaboration-200 bg-collaboration-50 text-collaboration-800 hover:bg-collaboration-100 hover:border-collaboration-300'
    }

    return {
      container: `${colorMap[item.color]} hover:shadow-md`,
      icon: `text-${item.color}-600`,
      badge: `bg-${item.color}-100 text-${item.color}-700`
    }
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={() => onToggleCollapse('source')} 
        className={`${componentPatterns.collapseButton} group`}
        role="button" 
        aria-expanded={!collapsed} 
        aria-controls="group-source"
      >
        <span className="flex items-center gap-2">
          <span>输入来源</span>
          <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">
            {SOURCE_OPTIONS.filter(opt => !opt.disabled).length} 种方式
          </span>
        </span>
        <div className="transition-transform duration-200 group-hover:scale-110">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
      
      {!collapsed && (
        <div id="group-source" className="space-y-3">
          {SOURCE_OPTIONS.map(item => {
            const isSelected = source === item.key
            const colorClasses = getColorClasses(item, isSelected)
            
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => handleSourceChange(item.key)}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all duration-300 
                    ${colorClasses.container}
                    ${isSelected ? 'transform scale-[1.02]' : ''}
                    ${item.disabled ? '' : 'hover:transform hover:scale-[1.01]'}
                  `}
                  aria-expanded={isSelected}
                  aria-disabled={item.disabled}
                  disabled={item.disabled}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                      ${isSelected ? 'bg-white/20' : `bg-${item.color}-100`}
                      transition-all duration-300
                    `}>
                      {item.Icon && (
                        <item.Icon 
                          size={20} 
                          className={`${colorClasses.icon} transition-all duration-300`}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">
                          {item.label}
                        </h3>
                        {item.disabled && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses.badge}`}>
                            即将推出
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <p className={`text-xs opacity-90 leading-relaxed ${
                        isSelected ? 'text-white/80' : 'text-current'
                      }`}>
                        {item.description}
                      </p>
                    </div>

                    <div className={`
                      flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isSelected ? 'bg-white/20' : 'bg-transparent'}
                    `}>
                      {isSelected ? (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      ) : (
                        <div className={`w-2 h-2 border-2 rounded-full ${
                          item.disabled ? 'border-brand-300' : `border-${item.color}-400`
                        }`}></div>
                      )}
                    </div>
                  </div>
                </button>

                {/* 悬停提示 */}
                {hoveredItem === item.key && !item.disabled && !isSelected && (
                  <div className="absolute left-0 right-0 -bottom-1 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 animate-pulse"></div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
