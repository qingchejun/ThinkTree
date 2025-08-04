/**
 * 思维导图创建页面 - 支持文件上传和文本输入
 * 需要登录才能访问
 */
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SimpleMarkmapBasic from '../../components/mindmap/SimpleMarkmapBasic';
import FileUpload from '../../components/upload/FileUpload';
import { useAuth } from '../../context/AuthContext';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";


export default function CreatePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [mindmapData, setMindmapData] = useState(null);
  const [error, setError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // 新状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [activeTab, setActiveTab] = useState('file');

  const handleGenerateFromText = () => {
    if (!markdownContent.trim()) {
      setError('请输入Markdown内容');
      return;
    }
    setError(null);
    setMindmapData({
      data: {
        title: title || '未命名思维导图',
        markdown: markdownContent,
      },
    });
  };

  // 认证检查 - 未登录用户重定向到首页并打开登录弹窗
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
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
    setError(null);
    setMindmapData(null);
    setUploadLoading(true);
  };

  const handleUploadSuccess = (result) => {
    setMindmapData(result);
    setError(null);
    setUploadLoading(false);
    // 切换到预览，并传递标题
    if (result.data && result.data.title) {
      setTitle(result.data.title);
    }
  };

  const handleUploadError = (errorMessage) => {
    setError(errorMessage);
    setMindmapData(null);
    setUploadLoading(false);
  };


  const handleSave = async () => {
    if (!user) {
      setError('请先登录才能保存思维导图');
      return;
    }

    const contentToSave = activeTab === 'file' ? mindmapData?.data?.markdown : markdownContent;
    const titleToSave = activeTab === 'file' ? (mindmapData?.data?.title || '未命名思维导图') : (title || '未命名思维导图');
    const descriptionToSave = description;
    const isPublicToSave = isPublic;

    if (!contentToSave) {
      setError('没有可保存的思维导图内容');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleToSave.trim(),
          content: contentToSave,
          description: descriptionToSave.trim() || null,
          is_public: isPublicToSave
        })
      });

      if (response.ok) {
        const savedMindmap = await response.json();
        router.push(`/mindmap/${savedMindmap.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '保存失败');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSaveLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="bg-background-primary border-b border-border-primary py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-text-primary">🎨 思维导图创建</h1>
          <p className="text-sm text-text-secondary mt-1">上传文档或输入文本，AI智能生成专业思维导图</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左侧：创建选项区 */}
          <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">文件上传</TabsTrigger>
                <TabsTrigger value="text">文本输入</TabsTrigger>
              </TabsList>
              <TabsContent value="file">
                <Card>
                  <CardHeader>
                    <CardTitle>文件上传</CardTitle>
                    <CardDescription>支持多种文件格式，AI智能解析生成思维导图</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      onUploadStart={handleUploadStart}
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                      token={token}
                      disabled={uploadLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="text">
                <Card>
                  <CardHeader>
                    <CardTitle>文本输入</CardTitle>
                    <CardDescription>直接输入Markdown内容创建思维导图</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">标题</Label>
                      <Input id="title" placeholder="请输入思维导图标题" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">描述 (可选)</Label>
                      <Input id="description" placeholder="请输入描述信息" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="markdown">Markdown 内容</Label>
                      <Textarea id="markdown" placeholder="# 标题\n- 分支1\n  - 子分支1\n- 分支2" rows={10} value={markdownContent} onChange={(e) => setMarkdownContent(e.target.value)} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                      <Label htmlFor="is-public">设为公开</Label>
                    </div>
                    <Button onClick={handleGenerateFromText} className="w-full">生成思维导图</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
                          onClick={() => setShowSaveModal(true)}
                          disabled={saveLoading || (activeTab === 'file' && !mindmapData) || (activeTab === 'text' && !markdownContent.trim())}
                          size="sm"
                        >
                          {saveLoading ? '保存中...' : '💾 保存'}
                        </Button>
                      )}
                      {!user && (
                        <Button
                          variant="secondary"
                          onClick={() => router.push('/')}
                          size="sm"
                        >
                          🔒 登录后保存
                        </Button>
                      )}
                      <div className="text-sm text-text-secondary flex items-center space-x-2">
                        <span>Markmap 思维导图</span>

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

      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>确认保存</CardTitle>
              <CardDescription>您确定要保存这个思维导图吗？</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-semibold">标题：</span>{activeTab === 'file' ? (mindmapData?.data?.title || '未命名思维导图') : (title || '未命名思维导图')}</p>
                <p><span className="font-semibold">描述：</span>{description || '无'}</p>
                <p><span className="font-semibold">公开状态：</span>{isPublic ? '公开' : '私有'}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSaveModal(false)}>取消</Button>
              <Button onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? '保存中...' : '确认保存'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

    </div>
  )
}