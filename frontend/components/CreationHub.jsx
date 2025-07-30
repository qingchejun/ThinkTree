/**
 * 创作中心组件 (CreationHub) - ThinkSo v3.2.2
 * 
 * 🎯 功能说明：
 * 这是用户登录后看到的主界面，提供思维导图创建和管理功能
 * 
 * 🔧 主要功能：
 * 1. 用户导航栏 - 显示用户信息、积分余额、下拉菜单
 * 2. 创作面板 - 支持多种输入方式（文本、文档上传、未来支持音视频等）
 * 3. 项目展示 - 显示用户最近创建的思维导图项目
 * 
 * 🎨 界面结构：
 * - Header: 品牌logo、用户菜单、积分显示、邀请功能
 * - 创建区域: 多标签式输入界面（文本/文档/音视频等）
 * - 项目列表: 最近项目的卡片式展示
 * 
 * 📝 使用场景：
 * - 用户成功登录后的主工作台
 * - 创建新思维导图的入口
 * - 管理已有项目的dashboard
 * 
 * ⚠️ 注意：
 * - 这是一个纯展示组件，没有实际的业务逻辑
 * - YouTube、播客、音频等功能标记为"开发中"
 * - 需要配合路由和状态管理来实现完整功能
 */
import React from 'react';
import { Gift, Database, LayoutDashboard, CreditCard, Settings, LogOut, FileText, FileUp, Youtube, Podcast, FileAudio, Link, Sparkles, UploadCloud, PlusCircle } from 'lucide-react';

const CreationHub = () => {
  return (
    <div id="loggedInView">
      <div className="h-screen flex flex-col bg-gray-50">
        {/* 
          顶部导航栏 - 用户已登录状态的主导航
          包含：品牌logo、邀请好友按钮、用户菜单（头像+积分+下拉菜单）
        */}
        <header className="bg-white/95 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200 flex-shrink-0">
          <div className="container mx-auto px-6 py-3 flex justify-between items-center">
            {/* 左侧：品牌logo和产品名称 */}
            <div className="flex items-center space-x-2">
              <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
            </div>
            
            {/* 右侧：邀请好友 + 用户菜单 */}
            <div className="flex items-center space-x-6">
              {/* 邀请好友按钮 - 用户获取奖励的入口 */}
              <a href="#" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm">
                <Gift className="w-4 h-4 text-orange-500" />
                <span>邀请好友</span>
              </a>
              
              {/* 用户菜单 - 显示头像、积分余额和下拉菜单 */}
              <div className="relative" id="userMenuButton">
                <button className="flex items-center space-x-2">
                  {/* 用户头像 */}
                  <img className="w-9 h-9 rounded-full" src="https://placehold.co/40x40/111827/ffffff?text=U" alt="用户头像" />
                  {/* 积分余额显示 */}
                  <div className="flex items-center space-x-1 text-gray-800 font-semibold">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span>1000</span>
                  </div>
                </button>
                
                {/* 用户下拉菜单 - 默认隐藏，点击后显示 */}
                <div id="userMenu" className="hidden absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border">
                  {/* 用户信息展示 */}
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-gray-800">houj0927</p>
                    <p className="text-sm text-gray-500">houj0927@gmail.com</p>
                  </div>
                  {/* 功能菜单项 */}
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <LayoutDashboard className="w-4 h-4" /><span>我的思维导图</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <CreditCard className="w-4 h-4" /><span>用量与计费</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="w-4 h-4" /><span>账户设置</span>
                  </a>
                  <div className="border-t my-1"></div>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /><span>退出登录</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主体内容区域 */}
        <main className="flex-1 container mx-auto px-6 py-8">
          {/* 
            思维导图创建区域 - 核心功能区
            支持多种输入方式：长文本、文档上传、音视频等（部分开发中）
          */}
          <div id="creationView" className="w-full max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">今天我们创造些什么？</h1>
            
            {/* 创建面板 - 白色卡片容器 */}
            <div className="bg-white rounded-2xl shadow-lg border mt-6">
              {/* 
                输入方式标签栏 - 支持切换不同的输入模式
                当前可用：长文本、文档上传
                开发中：YouTube、播客、音频文件、网页链接
              */}
              <div className="flex justify-center border-b p-2 space-x-1">
                {/* 长文本输入标签 - 默认选中 */}
                <button className="creation-tab-button creation-tab-active flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm" data-tab="text">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>长文本</span>
                </button>
                
                {/* 文档上传标签 */}
                <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm" data-tab="upload">
                  <FileUp className="w-4 h-4 text-green-500" />
                  <span>文档上传</span>
                </button>
                
                {/* 以下功能标记为开发中，暂时禁用 */}
                <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>YouTube</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
                
                <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <Podcast className="w-4 h-4 text-purple-500" />
                  <span>播客</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
                
                <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <FileAudio className="w-4 h-4 text-orange-500" />
                  <span>音频文件</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
                
                <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <Link className="w-4 h-4 text-sky-500" />
                  <span>网页链接</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
              </div>
              
              {/* 标签内容区域 */}
              <div className="p-4">
                {/* 长文本输入内容区 - 默认显示 */}
                <div id="tab-content-text" className="tab-content">
                  <textarea 
                    className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition text-base" 
                    placeholder="在此处输入你的想法、粘贴长文本或链接..."
                  ></textarea>
                  <div className="text-right mt-4">
                    <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto">
                      <Sparkles className="w-4 h-4" />
                      <span>生成</span>
                    </button>
                  </div>
                </div>
                
                {/* 文档上传内容区 - 默认隐藏 */}
                <div id="tab-content-upload" className="tab-content hidden">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center text-center p-4">
                    <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="font-semibold text-gray-700">将文件拖拽到此处或点击上传</p>
                  </div>
                  <div className="text-right mt-4">
                    <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto">
                      <Sparkles className="w-4 h-4" />
                      <span>生成</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 
            用户项目展示区域 - 显示最近创建的思维导图
            包含创建新项目的快捷入口和已有项目的卡片展示
          */}
          <div id="dashboardView" className="w-full max-w-6xl mx-auto mt-12">
            {/* 区域标题和查看全部链接 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">最近的项目</h2>
              <a href="#" className="text-sm font-semibold text-gray-600 hover:text-black">查看全部 &rarr;</a>
            </div>
            
            {/* 项目卡片网格布局 - 响应式设计，支持不同屏幕尺寸 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {/* 创建新项目卡片 - 虚线边框的快捷入口 */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-center h-full min-h-[196px] hover:bg-gray-100 transition-colors cursor-pointer">
                <PlusCircle className="w-12 h-12 text-gray-400 mb-2" />
                <h3 className="font-semibold text-gray-600">创建新项目</h3>
              </div>
              
              {/* 以下是示例项目卡片 - 实际使用时应该通过API获取用户的真实项目数据 */}
              
              {/* 项目卡片 1 */}
              <div className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
                <div className="bg-gray-200 h-32 flex items-center justify-center">
                  <img src="https://placehold.co/300x160/e5e7eb/111827?text=预览图" alt="思维导图预览图" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">第一季度产品规划</h3>
                  <p className="text-sm text-gray-500 mt-1">昨天 15:30 更新</p>
                </div>
              </div>
              
              {/* 项目卡片 2 */}
              <div className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
                <div className="bg-gray-200 h-32 flex items-center justify-center">
                  <img src="https://placehold.co/300x160/d1d5db/111827?text=预览图" alt="思维导图预览图" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">个人知识管理体系 (PKM)</h3>
                  <p className="text-sm text-gray-500 mt-1">3天前 更新</p>
                </div>
              </div>
              
              {/* 项目卡片 3 */}
              <div className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
                <div className="bg-gray-200 h-32 flex items-center justify-center">
                  <img src="https://placehold.co/300x160/e0e7ff/111827?text=预览图" alt="思维导图预览图" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">市场营销活动复盘</h3>
                  <p className="text-sm text-gray-500 mt-1">5天前 更新</p>
                </div>
              </div>
              
              {/* 项目卡片 4 */}
              <div className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
                <div className="bg-gray-200 h-32 flex items-center justify-center">
                  <img src="https://placehold.co/300x160/fce7f3/111827?text=预览图" alt="思维导图预览图" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">新功能头脑风暴</h3>
                  <p className="text-sm text-gray-500 mt-1">上周 更新</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreationHub;
