/**
 * 文件上传组件 - 简化版，只支持默认树状图格式
 */
'use client'

import { useState, useRef } from 'react'

const SUPPORTED_FORMATS = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.srt': 'text/plain'
}

export default function FileUpload({ onUploadStart, onUploadSuccess, onUploadError }) {
  const [dragActive, setDragActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [uploadMode, setUploadMode] = useState('file') // 'file' or 'text'
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // 处理拖拽事件
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // 文件选择处理
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // 验证文件类型
  const validateFile = (file) => {
    const fileExt = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!Object.keys(SUPPORTED_FORMATS).includes(fileExt)) {
      throw new Error(`不支持的文件格式: ${fileExt}`)
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('文件大小超过10MB限制')
    }
    
    return true
  }

  // 处理文件上传
  const handleFileUpload = async (file) => {
    try {
      validateFile(file)
      setIsUploading(true)
      if (onUploadStart) onUploadStart()

      const formData = new FormData()
      formData.append('file', file)

      // 使用默认的standard格式
      const response = await fetch(`http://localhost:8000/api/upload?format_type=standard`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        if (onUploadSuccess) onUploadSuccess(result)
      } else {
        throw new Error(result.detail || '上传失败')
      }
    } catch (error) {
      console.error('文件上传错误:', error)
      if (onUploadError) onUploadError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  // 处理文本输入
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      if (onUploadError) onUploadError('请输入文本内容')
      return
    }

    try {
      setIsUploading(true)
      if (onUploadStart) onUploadStart()

      const response = await fetch('http://localhost:8000/api/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textInput.trim(),
          format_type: 'standard'
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        if (onUploadSuccess) onUploadSuccess(result)
      } else {
        throw new Error(result.detail || '处理失败')
      }
    } catch (error) {
      console.error('文本处理错误:', error)
      if (onUploadError) onUploadError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full">
      {/* 上传模式选择 */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setUploadMode('file')}
          className={`px-4 py-2 font-medium ${
            uploadMode === 'file'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-indigo-600'
          }`}
        >
          📁 上传文件
        </button>
        <button
          onClick={() => setUploadMode('text')}
          className={`px-4 py-2 font-medium ml-4 ${
            uploadMode === 'text'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-indigo-600'
          }`}
        >
          ✏️ 直接输入
        </button>
      </div>

      {/* 文件上传区域 */}
      {uploadMode === 'file' && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx,.pdf,.srt"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="space-y-4">
            <div className="text-4xl">📎</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {dragActive ? '释放文件以上传' : '拖拽文件到这里或点击选择'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                支持 TXT, MD, DOCX, PDF, SRT 格式，最大 10MB
              </p>
            </div>
            {isUploading && (
              <div className="text-indigo-600">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                正在处理文件...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 文本输入区域 */}
      {uploadMode === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入文本内容
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="请输入您想要转换为思维导图的文本内容..."
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              disabled={isUploading}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              字符数：{textInput.length}
            </div>
          </div>
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isUploading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                正在生成思维导图...
              </>
            ) : (
              '🚀 生成思维导图'
            )}
          </button>
        </div>
      )}
    </div>
  )
}