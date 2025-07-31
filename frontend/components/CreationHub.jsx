/**
 * 创作中心组件 (CreationHub) - Refactored v1.0
 * * 🎯 功能说明：
 * 这是用户登录后看到的主界面，提供思维导图创建和管理功能。
 * 本版本已根据最终UI/UX设计稿进行重构。
 * * 🔧 主要功能：
 * 1. 用户导航栏 - 显示真实用户信息、积分余额、功能完善的下拉菜单。
 * 2. 创作面板 - 采用全新设计的UI，支持多种输入方式。
 * 3. 项目展示 - 显示用户最近创建的思维导图项目，并将“创建”按钮前置。
 * * 🎨 界面结构：
 * - AppHeader: 独立的顶部导航栏组件。
 * - CreationPanel: 独立的创作面板组件。
 * - RecentProjects: 独立的最近项目组件。
 * * 📝 使用场景：
 * - 用户成功登录后的主工作台。
 * - 创建新思维导图的入口。
 * - 管理已有项目的dashboard。
 */
'use client';
import React, { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation'; // Removed Next.js specific import
// import Link from 'next/link'; // Removed Next.js specific import
// import { useAuth } from '../context/AuthContext'; // Removed local context import
import { Gift, Zap, LayoutDashboard, CreditCard, Settings, LogOut, FileText, FileUp, Youtube, Podcast, FileAudio, Link as LinkIcon, Sparkles, UploadCloud, PlusCircle, ListChecks } from 'lucide-react';

// ===================================================================
// ======================= MOCKS FOR COMPILATION =====================
// ===================================================================

// Mocking Next.js's useRouter hook for compatibility in this environment.
const useRouter = () => {
  return {
    push: (path) => console.log(`Navigating to: ${path}`),
  };
};

// Mocking Next.js's Link component with a standard anchor tag.
const Link = ({ href, children, ...props }) => {
  return <a href={href} {...props}>{children}</a>;
};

// Mocking the useAuth context hook as the file is not available.
// This provides placeholder data to allow the component to render.
const useAuth = () => ({
  user: { email: 'houj0927@gmail.com', displayName: 'houj0927', avatarUrl: null },
  token: 'mock-jwt-token-for-preview',
  logout: () => console.log('Logout function called'),
  isLoading: false,
});

// Mocking environment variable
const process = {
    env: {
        NEXT_PUBLIC_API_URL: 'https://api.example.com'
    }
};


// ===================================================================
// ======================= 1. 子组件：顶部导航栏 ========================
// ===================================================================
const AppHeader = ({ user, credits, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // 点击外部关闭菜单的逻辑
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200 flex-shrink-0">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* 左侧：品牌logo */}
        <div className="flex items-center space-x-2">
          <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path fill="#111827" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8 152v-56H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v16h16a8 8 0 0 1 0 16h-16v56h32a8 8 0 0 1 0 16h-32v16a8 8 0 0 1-16 0v-16H96a8 8 0 0 1 0-16h24Z"/></svg>
          <span className="text-2xl font-bold text-gray-900">ThinkSo</span>
        </div>
        
        {/* 右侧：邀请好友 + 用户菜单 */}
        <div className="flex items-center space-x-6">
          <Link href="/settings" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm">
            <Gift className="w-4 h-4 text-orange-500" />
            <span>邀请好友</span>
          </Link>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 p-1 pr-3 rounded-full transition-colors"
            >
              <div className="flex items-center space-x-1 text-gray-800 font-semibold">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{credits}</span>
              </div>
              <img className="w-8 h-8 rounded-full" src={user?.avatarUrl || "https://placehold.co/40x40/111827/ffffff?text=U"} alt="用户头像" />
            </button>
            
            {/* 用户下拉菜单 */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border">
                <div className="px-4 py-2 border-b">
                  <p className="font-semibold text-gray-800 truncate">{user?.displayName || user?.email}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link href="/mindmaps" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><LayoutDashboard className="w-4 h-4 text-gray-500"/><span>我的思维导图</span></Link>
                <Link href="/settings" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><CreditCard className="w-4 h-4 text-gray-500"/><span>用量与计费</span></Link>
                <Link href="/settings" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Settings className="w-4 h-4 text-gray-500"/><span>账户设置</span></Link>
                <Link href="/settings" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><ListChecks className="w-4 h-4 text-gray-500"/><span>邀请记录</span></Link>
                <div className="border-t my-1"></div>
                <button onClick={onLogout} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4"/><span>退出登录</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ===================================================================
// ======================= 2. 子组件：创作面板 ========================
// ===================================================================
const CreationPanel = ({ onTextGenerate, onFileGenerate, loadingStates }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState(null);

  const { isAnalyzing, isGenerating } = loadingStates;

  // 模拟文件分析和生成逻辑
  const handleFileAnalysis = (file) => {
    // 这里应该调用你的真实文件分析API
    console.log("Analyzing file:", file.name);
    // 假设分析成功
    setFileAnalysis({
        fileName: file.name,
        estimatedCost: 15,
        sufficientCredits: true
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileAnalysis(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileAnalysis(e.target.files[0]);
    }
  };

  return (
    <div id="creationView" className="w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">今天我们创造些什么？</h1>
      <div className="bg-white rounded-2xl shadow-lg border mt-6">
        <div className="flex justify-center border-b p-2 space-x-1">
          <button onClick={() => setActiveTab('text')} className={`creation-tab-button flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm ${activeTab === 'text' ? 'creation-tab-active' : 'creation-tab-inactive'}`}><FileText className="w-4 h-4 text-blue-500"/><span>长文本</span></button>
          <button onClick={() => setActiveTab('upload')} className={`creation-tab-button flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm ${activeTab === 'upload' ? 'creation-tab-active' : 'creation-tab-inactive'}`}><FileUp className="w-4 h-4 text-green-500"/><span>文档上传</span></button>
          <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled><Youtube className="w-4 h-4 text-red-500"/><span>YouTube</span><span className="text-red-500 text-xs ml-1">(开发中)</span></button>
          <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled><Podcast className="w-4 h-4 text-purple-500"/><span>播客</span><span className="text-red-500 text-xs ml-1">(开发中)</span></button>
          <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled><FileAudio className="w-4 h-4 text-orange-500"/><span>音频文件</span><span className="text-red-500 text-xs ml-1">(开发中)</span></button>
          <button className="creation-tab-button creation-tab-inactive flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled><LinkIcon className="w-4 h-4 text-sky-500"/><span>网页链接</span><span className="text-red-500 text-xs ml-1">(开发中)</span></button>
        </div>
        <div className="p-4">
          {activeTab === 'text' && (
            <div>
              <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition text-base" placeholder="在此处输入你的想法、粘贴长文本或链接..."></textarea>
              <div className="text-right mt-4">
                <button onClick={() => onTextGenerate(textInput)} disabled={!textInput.trim() || isGenerating} className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto disabled:opacity-50"><Sparkles className="w-4 h-4"/><span>{isGenerating ? '生成中...' : '生成'}</span></button>
              </div>
            </div>
          )}
          {activeTab === 'upload' && (
            <div>
              <div onDragOver={(e) => {e.preventDefault(); setDragActive(true);}} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center text-center p-4 transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                <input type="file" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-10 h-10 text-gray-400 mb-2"/>
                <p className="font-semibold text-gray-700">将文件拖拽到此处或点击上传</p>
              </div>
              <div className="text-right mt-4">
                <button onClick={onFileGenerate} disabled={isAnalyzing} className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto disabled:opacity-50"><Sparkles className="w-4 h-4"/><span>{isAnalyzing ? '分析中...' : '生成'}</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// ======================= 3. 子组件：最近项目 ========================
// ===================================================================
const RecentProjects = ({ mindmaps, onCardClick, onCreateNew }) => {
  return (
    <div id="dashboardView" className="w-full max-w-6xl mx-auto mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">最近的项目</h2>
        <Link href="/mindmaps" className="text-sm font-semibold text-gray-600 hover:text-black">查看全部 &rarr;</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div onClick={onCreateNew} className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-center h-full min-h-[196px] hover:bg-gray-100 transition-colors cursor-pointer">
          <PlusCircle className="w-12 h-12 text-gray-400 mb-2"/>
          <h3 className="font-semibold text-gray-600">创建新项目</h3>
        </div>
        {mindmaps.map((mindmap) => (
          <div key={mindmap.id} onClick={() => onCardClick(mindmap.id)} className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
            <div className="bg-gray-200 h-32 flex items-center justify-center">
              <img src="https://placehold.co/300x160/e5e7eb/111827?text=预览图" alt="思维导图预览图" className="w-full h-full object-cover"/>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate" title={mindmap.title}>{mindmap.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{new Date(mindmap.updated_at).toLocaleDateString('zh-CN')} 更新</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ===================================================================
// ======================= 4. 主组件：创作中心 ========================
// ===================================================================
const CreationHub = () => {
  // 你的所有原始逻辑都保留在这里
  const { user, token, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [mindmaps, setMindmaps] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 路由保护
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  // 获取用户数据
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token || !user) return;
      setIsDataLoading(true);
      try {
        const [mindmapsResponse, creditsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/credits`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (mindmapsResponse.ok) setMindmaps((await mindmapsResponse.json())?.slice(0, 4) || []);
        if (creditsResponse.ok) setUserCredits((await creditsResponse.json()).balance || 0);

      } catch (error) {
        console.error('获取用户数据失败:', error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchUserData();
  }, [token, user]);

  // 处理文本生成
  const handleTextGenerate = async (textInput) => {
    if (!textInput.trim()) return alert('请输入内容');
    setIsGenerating(true);
    // ... 你的原始 handleTextGenerate 逻辑 ...
    console.log("Generating from text:", textInput);
    // 模拟API调用
    setTimeout(() => {
        setIsGenerating(false);
        alert("思维导图生成成功! (模拟)");
        router.push('/mindmap/new-id-from-text');
    }, 2000);
  };

  // 处理文件生成
  const handleFileGenerate = async (file) => {
    // ... 你的原始文件上传、分析、生成逻辑 ...
    console.log("Generating from file");
    setIsGenerating(true);
     setTimeout(() => {
        setIsGenerating(false);
        alert("文件思维导图生成成功! (模拟)");
        router.push('/mindmap/new-id-from-file');
    }, 2000);
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  // 渲染全新的UI结构
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <AppHeader user={user} credits={userCredits} onLogout={handleLogout} />
      <main className="flex-1 container mx-auto px-6 py-8 overflow-y-auto">
        <CreationPanel 
          onTextGenerate={handleTextGenerate}
          onFileGenerate={handleFileGenerate}
          loadingStates={{ isAnalyzing, isGenerating }}
        />
        <RecentProjects 
          mindmaps={mindmaps}
          onCardClick={(id) => router.push(`/mindmap/${id}`)}
          onCreateNew={() => console.log("Create new project clicked")}
        />
      </main>
    </div>
  );
};

export default CreationHub;
