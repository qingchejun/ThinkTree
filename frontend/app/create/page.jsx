/**
 * 思维导图创建页面 - 支持文件上传和文本输入
 * 需要登录才能访问
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SimpleMarkmapBasic from '../../components/mindmap/SimpleMarkmapBasic'
import FileUpload from '../../components/upload/FileUpload'
import { useAuth } from '../../context/AuthContext'
import { ToastManager } from '../../components/common/Toast'
import Header from '../../components/common/Header'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'

export default function CreatePage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const [uploadLoading, setUploadLoading] = useState(false)
  const [mindmapData, setMindmapData] = useState(null)
  const [error, setError] = useState(null)
  const [uploadInfo, setUploadInfo] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // 认证检查 - 未登录用户重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      ToastManager.warning('请先登录才能创建思维导图')
      router.push('/login?redirect=/create')
    }
  }, [user, isLoading, router])

  // 如果正在加载认证状态，显示加载页面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {isLoading ? '正在验证登录状态...' : '正在跳转到登录页面...'}
              </h3>
              <p className="text-text-secondary">请稍候</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleUploadStart = () => {
    setUploadLoading(true)
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
    setUploadLoading(false)
    setError(null)
  }

  const handleUploadError = (errorMessage) => {
    setError(errorMessage)
    setUploadLoading(false)
    setMindmapData(null)
    setUploadInfo(null)
  }

  const handleClear = () => {
    setMindmapData(null)
    setError(null)
    setUploadInfo(null)
  }

  const handleSave = () => {
    if (!user) {
      ToastManager.warning('请先登录才能保存思维导图')
      return
    }
    setShowSaveModal(true)
  }

  const handleSaveConfirm = async (title, description) => {
    if (!mindmapData?.data?.markdown) {
      ToastManager.error('没有可保存的思维导图内容')
      return
    }

    setSaveLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: mindmapData.data.markdown,
          description: description.trim() || null,
          is_public: false
        })
      })

      if (response.ok) {
        const savedMindmap = await response.json()
        ToastManager.success(`思维导图"${savedMindmap.title}"已成功保存！`)
        setShowSaveModal(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || '保存失败')
      }
    } catch (error) {
      ToastManager.error(`保存失败: ${error.message}`)
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* 头部导航 */}
      <Header 
        title="🎨 思维导图创建"
        subtitle="上传文档或输入文本，AI智能生成专业思维导图"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左侧：文件上传区 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📤 上传文档或输入文本
                </CardTitle>
                <CardDescription>
                  支持多种文件格式，AI智能解析生成思维导图
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUploadStart={handleUploadStart}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  token={token}
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
                    <Button
                      variant="secondary"
                      onClick={handleClear}
                      className="w-full"
                    >
                      🗑️ 清空结果
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：思维导图展示区 */}
          <div className="lg:col-span-2">
            <Card>
              {/* 思维导图展示 */}
              {mindmapData && (
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border-primary">
                    <h2 className="text-lg font-semibold text-text-primary">
                      🎨 {mindmapData.data?.title || '思维导图'}
                    </h2>
                    <div className="flex items-center space-x-4">
                      {user && (
                        <Button
                          onClick={handleSave}
                          disabled={saveLoading}
                          size="sm"
                        >
                          {saveLoading ? '保存中...' : '💾 保存'}
                        </Button>
                      )}
                      {!user && (
                        <Button
                          variant="secondary"
                          onClick={() => router.push('/login')}
                          size="sm"
                        >
                          🔒 登录后保存
                        </Button>
                      )}
                      <div className="text-sm text-text-secondary flex items-center space-x-2">
                        <span>Markmap 思维导图</span>
                        {uploadInfo && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            📄 {uploadInfo.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(600px-65px)]">
                    <SimpleMarkmapBasic mindmapData={mindmapData.data} />
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <CardContent>
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
                </CardContent>
              )}

              {/* 默认状态 */}
              {!mindmapData && !error && !uploadLoading && (
                <CardContent>
                  <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-border-primary rounded-lg">
                    <div className="text-center">
                      <div className="text-gray-400 text-6xl mb-4">🌳</div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">准备生成思维导图</h3>
                      <p className="text-text-secondary mb-4">
                        上传文档（PDF、Word、TXT等）或直接输入文本
                      </p>
                      <div className="text-xs text-text-tertiary space-y-1">
                        <p>✅ 支持 PDF、DOCX、TXT、MD、SRT 格式</p>
                        <p>✅ 最大文件大小：10MB</p>
                        <p>✅ AI智能解析，零信息损失</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}

              {/* 加载状态 */}
              {uploadLoading && (
                <CardContent>
                  <div className="h-[600px] flex items-center justify-center border border-border-primary rounded-lg bg-blue-50">
                    <div className="text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold text-brand-primary mb-2">AI 正在处理</h3>
                      <div className="text-text-secondary space-y-1">
                        <p>正在解析文档内容...</p>
                        <p className="text-sm">运用知识架构师算法生成思维导图</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 保存对话框 */}
      {showSaveModal && <SaveModal 
        onSave={handleSaveConfirm}
        onCancel={() => setShowSaveModal(false)}
        isLoading={saveLoading}
        defaultTitle={mindmapData?.data?.title || uploadInfo?.filename || '思维导图'}
      />}
    </div>
  )
}

// 保存对话框组件
function SaveModal({ onSave, onCancel, isLoading, defaultTitle }) {
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      ToastManager.error('请输入思维导图标题')
      return
    }
    onSave(title, description)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>💾 保存思维导图</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
                placeholder="请输入思维导图标题"
                maxLength={200}
                required
              />
              <p className="text-xs text-text-tertiary mt-1">{title.length}/200 字符</p>
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
                描述 (可选)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
                placeholder="描述这个思维导图的内容或用途..."
                maxLength={500}
              />
              <p className="text-xs text-text-tertiary mt-1">{description.length}/500 字符</p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !title.trim()}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}