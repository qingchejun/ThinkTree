/**
 * 思维导图生成测试页面 - 支持文件上传和文本输入
 */
'use client'

import { useState } from 'react'
import SimpleMarkmap from '../../components/mindmap/SimpleMarkmap'
import FileUpload from '../../components/upload/FileUpload'

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [mindmapData, setMindmapData] = useState(null)
  const [error, setError] = useState(null)
  const [uploadInfo, setUploadInfo] = useState(null)

  const handleUploadStart = () => {
    setIsLoading(true)
    setError(null)
    setMindmapData(null)
    setUploadInfo(null)
  }

  const handleUploadSuccess = (result) => {
    setMindmapData(result)
    setUploadInfo({
      filename: result.filename,
      fileType: result.file_type,
      contentPreview: result.content_preview
    })
    setIsLoading(false)
    setError(null)
  }

  const handleUploadError = (errorMessage) => {
    setError(errorMessage)
    setIsLoading(false)
    setMindmapData(null)
    setUploadInfo(null)
  }

  const handleClear = () => {
    setMindmapData(null)
    setError(null)
    setUploadInfo(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部操作区 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🧪 ThinkTree 思维导图生成
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                上传文档或输入文本，一键生成思维导图
              </p>
            </div>
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              ← 返回首页
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左侧：文件上传区 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📤 上传文档或输入文本
              </h2>
              
              <FileUpload
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />

              {/* 上传信息显示 */}
              {uploadInfo && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 mb-1">
                    ✅ 文件处理成功
                  </h4>
                  <div className="text-xs text-green-700 space-y-1">
                    <p><strong>文件:</strong> {uploadInfo.filename}</p>
                    <p><strong>类型:</strong> {uploadInfo.fileType}</p>
                    {uploadInfo.contentPreview && (
                      <p><strong>内容预览:</strong> {uploadInfo.contentPreview}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 清空按钮 */}
              {(mindmapData || error) && (
                <div className="mt-4">
                  <button
                    onClick={handleClear}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    🗑️ 清空结果
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：思维导图展示区 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {/* 思维导图展示 */}
              {mindmapData && (
                <div className="h-[600px] border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      🎨 {mindmapData.data?.title || '思维导图'}
                    </h2>
                    <div className="text-sm text-gray-500 flex items-center space-x-4">
                      <span>Markmap 思维导图</span>
                      {uploadInfo && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          📄 {uploadInfo.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-[calc(600px-65px)]">
                    <SimpleMarkmap mindmapData={mindmapData.data} />
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="h-[600px] flex items-center justify-center border border-red-200 rounded-lg bg-red-50">
                  <div className="text-center">
                    <div className="text-red-500 text-4xl mb-4">❌</div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">处理失败</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <div className="text-sm text-red-600">
                      <p>请检查：</p>
                      <ul className="mt-2 text-left inline-block">
                        <li>• 文件格式是否支持</li>
                        <li>• 文件大小是否超限</li>
                        <li>• 后端服务是否启动</li>
                        <li>• 网络连接是否正常</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 默认状态 */}
              {!mindmapData && !error && !isLoading && (
                <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">🌳</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">准备生成思维导图</h3>
                    <p className="text-gray-500 mb-4">
                      上传文档（PDF、Word、TXT等）或直接输入文本
                    </p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>✅ 支持 PDF、DOCX、TXT、MD、SRT 格式</p>
                      <p>✅ 最大文件大小：10MB</p>
                      <p>✅ AI智能解析，零信息损失</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 加载状态 */}
              {isLoading && (
                <div className="h-[600px] flex items-center justify-center border border-gray-200 rounded-lg bg-blue-50">
                  <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">AI 正在处理</h3>
                    <div className="text-indigo-700 space-y-1">
                      <p>正在解析文档内容...</p>
                      <p className="text-sm">运用知识架构师算法生成思维导图</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-600 text-lg mr-3 mt-0.5">💡</div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">v1.1.0 新功能</h4>
              <div className="text-blue-800 text-sm space-y-1">
                <p><strong>📁 多格式文档上传：</strong> 支持 PDF、Word、文本文件等多种格式</p>
                <p><strong>🧠 AI智能解析：</strong> 零信息损失，完整保留文档结构和细节</p>
                <p><strong>⚡ 高性能解析：</strong> 新增 PyMuPDF 库，PDF解析速度提升 3-5 倍</p>
                <p><strong>🎨 简洁界面：</strong> 优化的用户体验，专注核心功能</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}