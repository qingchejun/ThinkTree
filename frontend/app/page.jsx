/**
 * ThinkSo 首页 - 简化版
 */
'use client'

import { useAuth } from '../context/AuthContext'
import Header from '../components/common/Header'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

export default function HomePage() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部导航 */}
      <Header showCreateButton={true} />

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            将文档转换为思维导图
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            上传您的文档，AI将自动生成专业的思维导图。支持多种格式，一键分享。
          </p>
          
          {/* 快速开始按钮 */}
          <div className="space-y-4">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/create'}
              className="inline-flex items-center"
              variant="primary"
            >
              🚀 开始生成思维导图
            </Button>
            <p className="text-sm text-gray-500">
              点击上方按钮开始使用 AI 思维导图生成功能
            </p>
          </div>
        </div>

        {/* 功能特点 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <CardTitle>多格式支持</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">支持 TXT、MD、DOCX、PDF、SRT 等多种文件格式</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <CardTitle>AI智能解析</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">基于 Google Gemini AI，智能提取关键信息</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <CardTitle>一键分享</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">生成分享链接，轻松分享您的思维导图</p>
            </CardContent>
          </Card>
        </div>

        {/* 功能展示 */}
        <div className="mt-16">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <span className="text-green-600 text-lg mr-3">✅</span>
                <div>
                  <h3 className="text-lg font-medium text-green-800">正式版已发布</h3>
                  <p className="text-green-700 mt-1">
                    ThinkSo v1.0 正式版现已可用！点击
                    <a href="/create" className="font-medium underline hover:no-underline mx-1">思维导图生成器</a>
                    开始使用 AI 驱动的思维导图生成功能。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 调试工具入口已移除 - 邮件服务已正常工作 */}
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 ThinkSo. 让思维灵动闪现。</p>
        </div>
      </footer>
    </div>
  )
}