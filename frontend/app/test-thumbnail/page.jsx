'use client'

import React from 'react'
import MindmapThumbnail from '../../components/mindmap/MindmapThumbnail'

const TestThumbnailPage = () => {
  // 模拟思维导图数据
  const mockMindmaps = [
    {
      id: 1,
      title: "张满雨VicodinXYZ - 测试思维导图",
      content: `# 张满雨VicodinXYZ - 测试思维导图

## 主要分支 1
- 子节点 1.1
- 子节点 1.2
  - 子子节点 1.2.1
  - 子子节点 1.2.2

## 主要分支 2
- 子节点 2.1
- 子节点 2.2

## 主要分支 3
- 子节点 3.1
- 子节点 3.2
- 子节点 3.3`,
      updated_at: "2025/8/5"
    },
    {
      id: 2,
      title: "个人知识管理 (PKM)",
      content: `# 个人知识管理 (PKM)

## 知识获取
- 阅读
- 学习
- 实践

## 知识整理
- 分类
- 标签
- 关联

## 知识应用
- 创作
- 分享
- 实践`,
      updated_at: "2025/8/5"
    },
    {
      id: 3,
      title: "空内容测试",
      content: "",
      updated_at: "2025/8/5"
    },
    {
      id: 4,
      title: "无效内容测试",
      content: null,
      updated_at: "2025/8/5"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">思维导图缩略图测试</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMindmaps.map((mindmap, index) => (
            <div 
              key={mindmap.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* 预览图区域 */}
              <div className="h-32 overflow-hidden relative">
                <MindmapThumbnail 
                  content={mindmap.content} 
                  title={mindmap.title}
                  className="w-full h-full"
                />
              </div>
              
              {/* 卡片信息 */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate" title={mindmap.title}>
                  {mindmap.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {mindmap.updated_at} 更新
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  内容长度: {mindmap.content ? mindmap.content.length : 0} 字符
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">测试说明</h2>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>第一个卡片</strong>：正常的思维导图内容，应该显示实际的思维导图预览</li>
              <li>• <strong>第二个卡片</strong>：另一个正常内容，测试不同的思维导图结构</li>
              <li>• <strong>第三个卡片</strong>：空内容，应该显示"暂无内容"状态</li>
              <li>• <strong>第四个卡片</strong>：null内容，应该显示"暂无内容"状态</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>调试信息：</strong>请打开浏览器开发者工具的控制台，查看MindmapThumbnail组件的调试日志。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestThumbnailPage