'use client'

import React from 'react'
import { FileText } from 'lucide-react'
import Image from 'next/image'

/**
 * 思维导图缩略图组件
 * 使用静态图片显示思维导图预览
 */
const MindmapThumbnail = ({ content, title, className = "" }) => {
  // 空内容状态
  if (!content || content.trim() === '') {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
        <div className="flex flex-col items-center space-y-2 text-gray-400">
          <FileText className="w-8 h-8" />
          <span className="text-xs">暂无内容</span>
        </div>
      </div>
    )
  }

  // 显示静态思维导图预览图
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <Image
        src="/mindmap-preview.png"
        alt="思维导图预览"
        fill
        className="object-cover"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}
      />
      {/* 渐变遮罩，增强视觉效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none"></div>
      
      {/* 标题覆盖层 */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">{title}</p>
        </div>
      )}
    </div>
  )
}

export default MindmapThumbnail