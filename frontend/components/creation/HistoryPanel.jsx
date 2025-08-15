/**
 * 历史记录面板组件
 * 显示用户之前的生成结果，支持预览、重新应用和删除操作
 */
'use client'

import { useState, useEffect } from 'react'
import { History, Clock, FileText, Trash2, RotateCcw, ChevronDown, ChevronUp, Eye, X } from 'lucide-react'
import { componentPatterns } from '@/design-system/tokens/semantic'

// 历史记录存储键
const HISTORY_STORAGE_KEY = 'thinkso:creation-history'
const MAX_HISTORY_ITEMS = 20

export default function HistoryPanel({ 
  collapsed, 
  onToggleCollapse,
  onApplyHistory,
  currentSource,
  currentText 
}) {
  const [history, setHistory] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // 加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setHistory(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.warn('Failed to load creation history:', error)
      setHistory([])
    }
  }, [])

  // 保存历史记录到本地存储
  const saveHistory = (newHistory) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.warn('Failed to save creation history:', error)
    }
  }

  // 添加新的历史记录
  const addHistoryItem = (item) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      source: item.source || 'text',
      title: item.title || '未命名思维导图',
      text: item.text || '',
      mapStyle: item.mapStyle || 'original',
      preview: item.preview || null,
      estimatedCost: item.estimatedCost || 0
    }

    const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)
    saveHistory(newHistory)
  }

  // 删除历史记录项
  const deleteHistoryItem = (id) => {
    const newHistory = history.filter(item => item.id !== id)
    saveHistory(newHistory)
    if (selectedItem?.id === id) {
      setSelectedItem(null)
      setShowPreview(false)
    }
  }

  // 清空所有历史记录
  const clearAllHistory = () => {
    saveHistory([])
    setSelectedItem(null)
    setShowPreview(false)
  }

  // 应用历史记录项
  const applyHistoryItem = (item) => {
    if (onApplyHistory) {
      onApplyHistory({
        source: item.source,
        text: item.text,
        mapStyle: item.mapStyle,
        title: item.title
      })
    }
  }

  // 格式化时间显示
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取来源图标
  const getSourceIcon = (source) => {
    switch (source) {
      case 'upload': return FileText
      case 'text':
      default: return FileText
    }
  }

  // 预览模态框
  const PreviewModal = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-white rounded-2xl shadow-strong max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-brand-200">
          <h3 className="text-lg font-semibold text-brand-800">历史记录预览</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors duration-200 touch-manipulation"
            aria-label="关闭预览"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-brand-600 font-medium">标题：</span>
              <span className="text-brand-800 block md:inline md:ml-1">{item.title}</span>
            </div>
            <div>
              <span className="text-brand-600 font-medium">来源：</span>
              <span className="text-brand-800 block md:inline md:ml-1">{item.source === 'text' ? '文本输入' : '文件上传'}</span>
            </div>
            <div>
              <span className="text-brand-600 font-medium">样式：</span>
              <span className="text-brand-800 block md:inline md:ml-1">{item.mapStyle === 'original' ? '原始' : '精炼'}</span>
            </div>
            <div>
              <span className="text-brand-600 font-medium">时间：</span>
              <span className="text-brand-800 block md:inline md:ml-1">{formatTime(item.timestamp)}</span>
            </div>
          </div>
          {item.text && (
            <div>
              <h4 className="text-brand-600 font-medium mb-2">输入内容：</h4>
              <div className="bg-brand-50 rounded-lg p-4 max-h-32 md:max-h-40 overflow-y-auto">
                <p className="text-sm text-brand-700 whitespace-pre-wrap">
                  {item.text.length > 500 ? `${item.text.slice(0, 500)}...` : item.text}
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button
              onClick={() => {
                applyHistoryItem(item)
                onClose()
              }}
              className="flex-1 bg-core-600 hover:bg-core-700 text-white px-4 py-3 md:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium touch-manipulation"
            >
              <RotateCcw size={16} />
              应用此记录
            </button>
            <button
              onClick={() => {
                deleteHistoryItem(item.id)
                onClose()
              }}
              className="px-4 py-3 md:py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium touch-manipulation"
            >
              <Trash2 size={16} />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // 暴露添加历史记录的方法给父组件
  useEffect(() => {
    window.addCreationHistory = addHistoryItem
    return () => {
      delete window.addCreationHistory
    }
  }, [history])

  return (
    <div className="space-y-4">
      <button 
        onClick={() => onToggleCollapse('history')} 
        className={`${componentPatterns.collapseButton} group`}
        role="button" 
        aria-expanded={!collapsed} 
        aria-controls="group-history"
      >
        <span className="flex items-center gap-2">
          <History size={16} />
          <span>历史记录</span>
          <span className="text-xs bg-core-100 text-core-700 px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </span>
        <div className="transition-transform duration-200 group-hover:scale-110">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
      
      {!collapsed && (
        <div id="group-history" className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-brand-500">
              <History size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无历史记录</p>
              <p className="text-xs mt-1">生成思维导图后会自动保存记录</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-brand-600">最近 {history.length} 条记录</span>
                <button
                  onClick={clearAllHistory}
                  className="text-xs text-brand-500 hover:text-brand-700 transition-colors duration-200"
                >
                  清空全部
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map(item => {
                  const SourceIcon = getSourceIcon(item.source)
                  return (
                    <div
                      key={item.id}
                      className="bg-brand-50 rounded-lg p-3 hover:bg-brand-100 transition-colors duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-core-100 rounded-lg flex items-center justify-center">
                          <SourceIcon size={14} className="text-core-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-brand-800 truncate">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={12} className="text-brand-400" />
                            <span className="text-xs text-brand-500">
                              {formatTime(item.timestamp)}
                            </span>
                            <span className="text-xs text-brand-400">•</span>
                            <span className="text-xs text-brand-500">
                              {item.source === 'text' ? '文本' : '文件'}
                            </span>
                          </div>
                          {item.text && (
                            <p className="text-xs text-brand-600 mt-1 truncate">
                              {item.text.slice(0, 50)}...
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              setShowPreview(true)
                            }}
                            className="p-1.5 rounded-md bg-brand-200 hover:bg-brand-300 text-brand-600 transition-colors duration-200"
                            title="预览"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => applyHistoryItem(item)}
                            className="p-1.5 rounded-md bg-core-200 hover:bg-core-300 text-core-600 transition-colors duration-200"
                            title="应用"
                          >
                            <RotateCcw size={12} />
                          </button>
                          <button
                            onClick={() => deleteHistoryItem(item.id)}
                            className="p-1.5 rounded-md bg-brand-200 hover:bg-red-200 text-brand-600 hover:text-red-600 transition-colors duration-200"
                            title="删除"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* 预览模态框 */}
      {showPreview && selectedItem && (
        <PreviewModal 
          item={selectedItem} 
          onClose={() => {
            setShowPreview(false)
            setSelectedItem(null)
          }} 
        />
      )}
    </div>
  )
}
