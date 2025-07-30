import React from 'react';

const CreationHub = () => {
  return (
    <div id="loggedInView">
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="bg-white/95 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200 flex-shrink-0">
          <div className="container mx-auto px-6 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm">
                <i data-lucide="gift" className="w-4 h-4 text-orange-500"></i>
                <span>邀请好友</span>
              </a>
              <div className="relative" id="userMenuButton">
                <button className="flex items-center space-x-2">
                  <img className="w-9 h-9 rounded-full" src="https://placehold.co/40x40/111827/ffffff?text=U" alt="用户头像" />
                  <div className="flex items-center space-x-1 text-gray-800 font-semibold">
                    <i data-lucide="database" className="w-4 h-4 text-gray-500"></i>
                    <span>1000</span>
                  </div>
                </button>
                <div id="userMenu" className="hidden absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border">
                  <div className="px-4 py-2 border-b"><p className="font-semibold text-gray-800">houj0927</p><p className="text-sm text-gray-500">houj0927@gmail.com</p></div>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i data-lucide="layout-dashboard" className="w-4 h-4"></i><span>我的思维导图</span></a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i data-lucide="credit-card" className="w-4 h-4"></i><span>用量与计费</span></a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i data-lucide="settings" className="w-4 h-4"></i><span>账户设置</span></a>
                  <div className="border-t my-1"></div>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><i data-lucide="log-out" className="w-4 h-4"></i><span>退出登录</span></a>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-6 py-8">
          <div id="creationView" className="w-full max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">今天我们创造些什么？</h1>
            <div className="bg-white rounded-2xl shadow-lg border mt-6">
              <div className="flex justify-center border-b p-2 space-x-1">
                <button className="creation-tab-button creation-tab-active flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm" data-tab="text"><i data-lucide="file-text" className="w-4 h-4 text-blue-500"></i><span>长文本</span></button>
                <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm" data-tab="upload"><i data-lucide="file-up" className="w-4 h-4 text-green-500"></i><span>文档上传</span></button>
              </div>
              <div className="p-4">
                <div id="tab-content-text" className="tab-content">
                  <textarea className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition text-base" placeholder="在此处输入你的想法、粘贴长文本或链接..."></textarea>
                  <div className="text-right mt-4">
                    <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto"><i data-lucide="sparkles" className="w-4 h-4"></i><span>生成</span></button>
                  </div>
                </div>
                <div id="tab-content-upload" className="tab-content hidden">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center text-center p-4">
                    <i data-lucide="upload-cloud" className="w-10 h-10 text-gray-400 mb-2"></i>
                    <p className="font-semibold text-gray-700">将文件拖拽到此处或点击上传</p>
                  </div>
                  <div className="text-right mt-4">
                    <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto"><i data-lucide="sparkles" className="w-4 h-4"></i><span>生成</span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="dashboardView" className="w-full max-w-6xl mx-auto mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">最近的项目</h2>
              <a href="#" className="text-sm font-semibold text-gray-600 hover:text-black">查看全部 &rarr;</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-center h-full min-h-[196px] hover:bg-gray-100 transition-colors cursor-pointer"><i data-lucide="plus-circle" className="w-12 h-12 text-gray-400 mb-2"></i><h3 className="font-semibold text-gray-600">创建新项目</h3></div>
              <div className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"><div className="bg-gray-200 h-32 flex items-center justify-center"><img src="https://placehold.co/300x160/e5e7eb/111827?text=预览图" alt="思维导图预览图" className="w-full h-full object-cover" /></div><div className="p-4"><h3 className="font-semibold text-gray-800 truncate">第一季度产品规划</h3><p className="text-sm text-gray-500 mt-1">昨天 15:30 更新</p></div></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreationHub;
