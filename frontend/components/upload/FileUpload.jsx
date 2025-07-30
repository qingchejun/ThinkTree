/**
 * 文件上传组件 - 支持两步文件上传流程
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const SUPPORTED_FORMATS = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.srt': 'text/plain'
}

// 安全提取错误信息的工具函数
const getErrorMessage = (detail, defaultMessage = '处理失败') => {
  if (typeof detail === 'string') {
    return detail
  } else if (typeof detail === 'object' && detail !== null) {
    // 如果是对象，尝试提取有用信息
    if (detail.message) return detail.message
    if (detail.error) return detail.error
    if (Array.isArray(detail)) {
      // 处理验证错误数组
      return detail.map(err => typeof err === 'string' ? err : err.message || err.msg || '验证错误').join(', ')
    }
    // 其他对象情况，转换为可读字符串
    try {
      return JSON.stringify(detail)
    } catch {
      return defaultMessage
    }
  }
  return defaultMessage
}

export default function FileUpload({ onUploadStart, onUploadSuccess, onUploadError, token }) {
  const { user, token: authToken, refreshUser } = useAuth()
  
  // 优先使用传入的token，如果没有则使用AuthContext的token
  const activeToken = token || authToken
  const [dragActive, setDragActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [uploadMode, setUploadMode] = useState('file') // 'file' or 'text'
  const [isUploading, setIsUploading] = useState(false)
  const [creditEstimate, setCreditEstimate] = useState(null)
  const [estimating, setEstimating] = useState(false)
  
  // 两步流程相关状态
  const [fileAnalysis, setFileAnalysis] = useState(null) // 文件分析结果
  const [isAnalyzing, setIsAnalyzing] = useState(false) // 文件分析中
  const [isGenerating, setIsGenerating] = useState(false) // 思维导图生成中
  const [generationComplete, setGenerationComplete] = useState(false) // 生成完成标志
  
  const fileInputRef = useRef(null)

  // 估算积分成本
  const estimateCreditCost = async (text) => {
    if (!text.trim()) {
      setCreditEstimate(null)
      return
    }

    try {
      setEstimating(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/estimate-credit-cost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ text: text.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        setCreditEstimate(result)
      } else {
        setCreditEstimate(null)
      }
    } catch (error) {
      console.error('积分估算失败:', error)
      setCreditEstimate(null)
    } finally {
      setEstimating(false)
    }
  }

  // 监听文本输入变化，实时估算积分
  useEffect(() => {
    if (uploadMode === 'text' && textInput.trim()) {
      const timer = setTimeout(() => {
        estimateCreditCost(textInput)
      }, 500) // 防抖，避免频繁请求
      
      return () => clearTimeout(timer)
    } else {
      setCreditEstimate(null)
    }
  }, [textInput, uploadMode, activeToken])

  // 处理积分不足的友好提示
  const showInsufficientCreditsAlert = (requiredCredits, currentBalance) => {
    const shortfall = requiredCredits - currentBalance
    const message = `积分不足！需要 ${requiredCredits} 积分，当前余额 ${currentBalance} 积分，还差 ${shortfall} 积分。快去邀请好友赚取更多积分吧！`
    
    if (onUploadError) {
      onUploadError(message)
    }
  }

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
      handleFileAnalysis(files[0])
    }
  }

  // 文件选择处理
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFileAnalysis(files[0])
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

  // 第一步：处理文件分析
  const handleFileAnalysis = async (file) => {
    try {
      validateFile(file)
      setIsAnalyzing(true)
      setFileAnalysis(null)
      // 注意：这里不调用onUploadStart，只在实际生成时才调用

      const formData = new FormData()
      formData.append('file', file)

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/upload/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        },
        body: formData,
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setFileAnalysis(result)
        console.log('文件分析成功:', result)
        console.log('fileAnalysis state将被设置为:', result)
      } else {
        console.error('文件分析失败:', result)
        throw new Error(getErrorMessage(result.detail, '文件分析失败'))
      }
    } catch (error) {
      console.error('文件分析错误:', error)
      if (onUploadError) onUploadError(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 第二步：处理文件生成
  const handleFileGenerate = async () => {
    if (!fileAnalysis?.file_token) return

    try {
      setIsGenerating(true)
      // 在用户点击生成按钮时才调用onUploadStart
      if (onUploadStart) onUploadStart()

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/mindmaps/generate-from-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          file_token: fileAnalysis.file_token
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // 成功后刷新用户积分信息
        if (refreshUser) refreshUser()
        if (onUploadSuccess) onUploadSuccess(result)
        // 不清除分析结果，而是标记生成完成
        setGenerationComplete(true)
      } else if (response.status === 402) {
        // 积分不足的特殊处理
        const errorDetail = result.detail
        if (typeof errorDetail === 'object' && errorDetail.message === '积分不足') {
          showInsufficientCreditsAlert(errorDetail.required_credits, errorDetail.current_balance)
        } else {
          throw new Error(getErrorMessage(result.detail, '积分不足'))
        }
      } else {
        throw new Error(getErrorMessage(result.detail, '生成失败'))
      }
    } catch (error) {
      console.error('思维导图生成错误:', error)
      if (onUploadError) onUploadError(error.message)
    } finally {
      setIsGenerating(false)
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

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          text: textInput.trim()
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // 成功后刷新用户积分信息
        if (refreshUser) refreshUser()
        if (onUploadSuccess) onUploadSuccess(result)
      } else if (response.status === 402) {
        // 积分不足的特殊处理
        const errorDetail = result.detail
        if (typeof errorDetail === 'object' && errorDetail.message === '积分不足') {
          showInsufficientCreditsAlert(errorDetail.required_credits, errorDetail.current_balance)
        } else {
          throw new Error(getErrorMessage(result.detail, '积分不足'))
        }
      } else {
        throw new Error(getErrorMessage(result.detail, '处理失败'))
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
          onClick={() => {
            setUploadMode('file')
            setFileAnalysis(null) // 切换模式时清空分析结果
            setGenerationComplete(false) // 重置生成完成状态
          }}
          className={`px-4 py-2 font-medium ${
            uploadMode === 'file'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-indigo-600'
          }`}
        >
          📁 上传文件
        </button>
        <button
          onClick={() => {
            setUploadMode('text')
            setFileAnalysis(null) // 切换模式时清空分析结果
            setGenerationComplete(false) // 重置生成完成状态
          }}
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
        <>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
            } ${isAnalyzing || isGenerating ? 'opacity-50 pointer-events-none' : ''}`}
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
              disabled={isAnalyzing || isGenerating}
            />
            
            <div className="space-y-4">
              {/* 根据状态显示不同内容 */}
              {generationComplete && fileAnalysis ? (
                // 生成完成后显示内容总结
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    文档内容总结
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {fileAnalysis.content_preview && fileAnalysis.content_preview.length > 50 
                      ? fileAnalysis.content_preview.substring(0, 50) + '...'
                      : fileAnalysis.content_preview || '文档已成功解析并生成思维导图'}
                  </p>
                </div>
              ) : fileAnalysis && !generationComplete ? (
                // 文件分析完成但未生成时的状态
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    文档已解析完成
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    点击下方按钮开始生成思维导图
                  </p>
                </div>
              ) : (
                // 默认上传状态
                <>
                  <div className="text-4xl">📎</div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      {dragActive ? '释放文件以上传' : '拖拽文件到这里或点击选择'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      支持 TXT, MD, DOCX, PDF, SRT 格式，最大 10MB
                    </p>
                  </div>
                </>
              )}
              
              {/* 状态指示器 */}
              {isAnalyzing && (
                <div className="text-indigo-600">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  正在分析文件内容...
                </div>
              )}
              {isGenerating && (
                <div className="text-indigo-600">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  内容总结中...
                </div>
              )}
            </div>
          </div>

          {/* 积分成本信息 - 仅在文件分析完成后显示 */}
          {fileAnalysis && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              fileAnalysis.analysis?.sufficient_credits
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <span className="mr-2">
                  {fileAnalysis.analysis?.sufficient_credits ? '✅' : '⚠️'}
                </span>
                <div>
                  <div className="font-medium">
                    预计消耗 {fileAnalysis.analysis?.estimated_cost || 0} 积分
                    {fileAnalysis.analysis?.sufficient_credits 
                      ? ' - 积分充足，可以生成' 
                      : ' - 积分不足，无法生成'
                    }
                  </div>
                  <div className="mt-1 text-xs opacity-75">
                    当前余额: {fileAnalysis.analysis?.user_balance || 0} 积分 | 
                    文本长度: {fileAnalysis.analysis?.text_length || 0} 字符 | 
                    {fileAnalysis.analysis?.pricing_rule || '每500个字符消耗1积分'}
                  </div>
                  {!fileAnalysis.analysis?.sufficient_credits && (
                    <div className="mt-2">
                      <button 
                        onClick={() => window.open('/pricing', '_blank')}
                        className="text-red-700 underline hover:text-red-900 bg-transparent border-none cursor-pointer"
                      >
                        💰 增加积分
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 开始生成按钮 - 始终显示在文件上传框下方 */}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleFileGenerate}
              disabled={isAnalyzing || isGenerating || !fileAnalysis || !fileAnalysis.analysis?.sufficient_credits}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  正在生成思维导图...
                </>
              ) : isAnalyzing ? (
                <>
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  正在分析文件...
                </>
              ) : (
                '🚀 生成思维导图'
              )}
            </button>
            
            <button
              onClick={() => {
                setFileAnalysis(null)
                setGenerationComplete(false)
              }}
              disabled={isGenerating || isAnalyzing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {generationComplete ? '重新上传' : '取消'}
            </button>
          </div>
        </>
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
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-gray-500">字符数：{textInput.length}</span>
              {creditEstimate && (
                <span className={`font-medium ${
                  creditEstimate.sufficient_credits 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {estimating ? '计算中...' : `预计消耗: ${creditEstimate.estimated_cost} 积分`}
                </span>
              )}
            </div>
          </div>

          {/* 积分状态提示 */}
          {creditEstimate && (
            <div className={`p-3 rounded-md text-sm ${
              creditEstimate.sufficient_credits
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <span className="mr-2">
                  {creditEstimate.sufficient_credits ? '✅' : '⚠️'}
                </span>
                <div>
                  <div className="font-medium">
                    {creditEstimate.sufficient_credits 
                      ? '积分充足，可以生成' 
                      : '积分不足，无法生成'
                    }
                  </div>
                  <div className="mt-1 text-xs opacity-75">
                    当前余额: {creditEstimate.user_balance} 积分 | 
                    预计消耗: {creditEstimate.estimated_cost} 积分 | 
                    {creditEstimate.pricing_rule}
                  </div>
                  {!creditEstimate.sufficient_credits && (
                    <div className="mt-2">
                      <button 
                        onClick={() => window.open('/pricing', '_blank')}
                        className="text-red-700 underline hover:text-red-900 bg-transparent border-none cursor-pointer"
                      >
                        💰 增加积分
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isUploading || (creditEstimate && !creditEstimate.sufficient_credits)}
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