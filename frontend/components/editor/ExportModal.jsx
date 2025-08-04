'use client'

import { useState } from 'react'
import { X, Download, FileText, Image as ImageIcon, Code } from 'lucide-react'
import { Button } from '../ui/Button'

export default function ExportModal({ isOpen, onClose, mindmapTitle }) {
  const [exportType, setExportType] = useState('svg')

  if (!isOpen) return null

  const handleExport = () => {
    // 在这里处理导出逻辑
    console.log(`Exporting ${mindmapTitle} as ${exportType}`)
    onClose()
  }

  const exportOptions = [
    { id: 'svg', name: 'SVG 矢量图', icon: ImageIcon },
    { id: 'png', name: 'PNG 图片', icon: ImageIcon },
    { id: 'md', name: 'Markdown 文件', icon: FileText },
    { id: 'json', name: 'JSON 数据', icon: Code },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">导出思维导图</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            选择一种格式导出 &ldquo;<strong>{mindmapTitle}</strong>&rdquo;:
          </p>
          <div className="space-y-2">
            {exportOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setExportType(option.id)}
                className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                  exportType === option.id
                    ? 'bg-indigo-100 border-indigo-500 border'
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }`}>
                <option.icon className="w-5 h-5 mr-3 text-gray-500" />
                <span>{option.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>
    </div>
  )
}