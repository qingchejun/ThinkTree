import React from 'react';

const LandingPage = () => {
  return (
    <div id="loggedOutView">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
              <path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z" />
            </svg>
            <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-800 font-semibold hover:text-black">登录</a>
            <a href="#" className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors">免费注册</a>
          </div>
        </div>
      </header>

      {/* 英雄区域 */}
      <main className="container mx-auto px-6 pt-20 pb-16 text-center">
        {/* 新增的徽章 */}
        <div className="mb-6 flex justify-center items-center">
          <div className="bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-3 py-1 text-sm font-medium flex items-center">
            <i data-lucide="sparkles" className="w-3 h-3 mr-1.5"></i>
            NEW
          </div>
          <span className="text-gray-600 ml-3">智能驱动的思维与知识管理伙伴</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight">
          一念所至，即刻成图
        </h1>
        
        <div className="mt-8 flex justify-center">
          <a href="#" className="bg-gray-800 text-white px-12 py-4 rounded-lg font-bold text-xl shadow-lg hover:bg-black transition-all transform hover:scale-105">
            免费生成思维导图
          </a>
        </div>

        {/* 新增的福利横幅 (已加宽) */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4 text-center">
            <p className="text-orange-800 font-medium">
              🎉 限时内测福利！注册即送 1000 积分，畅享10万字文档处理额度！
            </p>
          </div>
        </div>
      </main>

      {/* 新的核心功能模块 (全新布局) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">强大功能，简单操作</h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">集成了最先进的 AI 技术，为您提供最佳的思维导图创建体验</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 功能卡片 1: 智能生成 */}
            <div className="bg-gray-50 p-8 rounded-2xl flex items-start space-x-6">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <i data-lucide="cpu" className="w-7 h-7 text-blue-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">智能生成</h3>
                <p className="text-gray-600">输入关键词或描述，AI 自动分析并生成结构化的思维导图。</p>
              </div>
            </div>
            {/* 功能卡片 2: 多格式导入 */}
            <div className="bg-gray-50 p-8 rounded-2xl flex items-start space-x-6">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-sky-100 rounded-xl">
                 <i data-lucide="file-stack" className="w-7 h-7 text-sky-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">多格式导入</h3>
                <p className="text-gray-600">支持文字、文档、音视频、播客及网页链接等多种内容来源。</p>
              </div>
            </div>
            {/* 功能卡片 3: 协作分享 */}
            <div className="bg-gray-50 p-8 rounded-2xl flex items-start space-x-6">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                <i data-lucide="users" className="w-7 h-7 text-green-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">协作分享</h3>
                <p className="text-gray-600">一键分享给团队成员，支持实时协作编辑，让团队思维碰撞更高效。</p>
              </div>
            </div>
            {/* 功能卡片 4: 智能优化 */}
            <div className="bg-gray-50 p-8 rounded-2xl flex items-start space-x-6">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-rose-100 rounded-xl">
                 <i data-lucide="brain-circuit" className="w-7 h-7 text-rose-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">智能优化</h3>
                <p className="text-gray-600">AI 持续学习优化，根据您的使用习惯提供个性化的思维导图建议。</p>
              </div>
            </div>
            {/* 功能卡片 5: 多格式导出 */}
            <div className="bg-gray-50 p-8 rounded-2xl flex items-start space-x-6">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <i data-lucide="file-output" className="w-7 h-7 text-purple-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">多格式导出</h3>
                <p className="text-gray-600">支持 PNG, PDF, SVG 等多种格式导出，满足不同场景的使用需求。</p>
              </div>
            </div>
            {/* 功能卡片 6: 无限扩展 */}
            <div className="bg-gray-50 p-8 rounded-2xl flex items-start space-x-6">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl">
                 <i data-lucide="infinity" className="w-7 h-7 text-amber-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">无限扩展</h3>
                <p className="text-gray-600">支持无限层级的节点扩展，让您的思维导图可以承载更复杂的内容。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "如何工作"区 */}
      <section className="py-20 bg-gray-50 border-t">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">生成导图，只需三步</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start text-center relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5">
              <svg width="100%" height="100%"><line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="2" strokeDasharray="8 8" className="stroke-gray-300"></line></svg>
            </div>
            <div className="relative bg-white p-8 rounded-xl border"><div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 border-gray-50">1</div><div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 mt-8"><i data-lucide="upload-cloud" className="w-10 h-10 text-blue-600"></i></div><h3 className="text-xl font-semibold">输入内容</h3><p className="text-gray-500 mt-2">拖拽文件或粘贴文本。</p></div>
            <div className="relative bg-white p-8 rounded-xl border"><div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 border-gray-50">2</div><div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 mt-8"><i data-lucide="sparkles" className="w-10 h-10 text-purple-600"></i></div><h3 className="text-xl font-semibold">AI 即刻生成</h3><p className="text-gray-500 mt-2">智能分析核心要点。</p></div>
            <div className="relative bg-white p-8 rounded-xl border"><div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 border-gray-50">3</div><div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 mt-8"><i data-lucide="eye" className="w-10 h-10 text-green-600"></i></div><h3 className="text-xl font-semibold">查看、编辑与分享</h3><p className="text-gray-500 mt-2">获得清晰的思维导图。</p></div>
          </div>
        </div>
      </section>

      {/* 最后的行动号召区 */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold">ThinkSo，让思维更灵动。</h2>
          <a href="#" className="mt-8 inline-block bg-white text-black px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-gray-200 transition-all transform hover:scale-105">
            立即免费试用
          </a>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-black text-gray-400 py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 ThinkSo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
