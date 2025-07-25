/**
 * ThinkSo 首页 - 简化版
 */
'use client'

import { useAuth } from '../context/AuthContext'
import Header from '../components/common/Header'

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
            <a
              href="/create"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              🚀 开始生成思维导图
            </a>
            <p className="text-sm text-gray-500">
              点击上方按钮开始使用 AI 思维导图生成功能
            </p>
          </div>
        </div>

        {/* 功能特点 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">多格式支持</h3>
            <p className="text-gray-600">支持 TXT、MD、DOCX、PDF、SRT 等多种文件格式</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI智能解析</h3>
            <p className="text-gray-600">基于 Google Gemini AI，智能提取关键信息</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">一键分享</h3>
            <p className="text-gray-600">生成分享链接，轻松分享您的思维导图</p>
          </div>
        </div>

        {/* 功能展示 */}
        <div className="mt-16 bg-green-50 border border-green-200 rounded-lg p-6">
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
        </div>

        {/* 调试工具入口 - 临时 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-yellow-600 text-lg mr-3">🔧</span>
              <div>
                <h3 className="text-lg font-medium text-yellow-800">邮件服务调试工具</h3>
                <p className="text-yellow-700 mt-1 text-sm">
                  诊断和测试邮件发送功能 - 开发调试专用
                </p>
              </div>
            </div>
            <a
              href="/debug-email"
              className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              🔍 打开调试工具
            </a>
          </div>
        </div>
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