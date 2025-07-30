import React from 'react';

const LandingPage = () => {
  return (
    <div id="loggedOutView">
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

      <main className="container mx-auto px-6 pt-20 pb-16 text-center">
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
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4 text-center">
            <p className="text-orange-800 font-medium">
              🎉 限时内测福利！注册即送 1000 积分，畅享10万字文档处理额度！
            </p>
          </div>
        </div>
      </main>
      
      <section className="py-24 bg-white">
        {/* ... (此处省略中间内容) ... */}
      </section>
      
      <footer className="bg-black text-gray-400 py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 ThinkSo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
