/**
 * 创作中心组件 (CreationHub) - ThinkSo v3.2.2
 * 
 * 🎯 功能说明：
 * 这是用户登录后看到的主界面，提供思维导图创建和管理功能
 * 
 * 🔧 主要功能：
 * 1. 用户导航栏 - 显示真实用户信息、积分余额、下拉菜单
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
 * - 集成了真实的用户数据和API调用
 * - YouTube、播客、音频等功能标记为"开发中"
 * - 包含完整的路由和状态管理功能
 */
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Gift, Database, LayoutDashboard, CreditCard, Settings, LogOut, FileText, FileUp, Youtube, Podcast, FileAudio, Link as LinkIcon, Sparkles, UploadCloud, PlusCircle } from 'lucide-react';

const CreationHub = () => {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  
  // 状态管理
  const [mindmaps, setMindmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  
  // 文件上传相关状态
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 路由保护
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, isLoading, router]);

  // 获取用户思维导图和积分信息
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token || !user) return;

      try {
        // 获取思维导图列表
        const mindmapsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (mindmapsResponse.ok) {
          const mindmapsData = await mindmapsResponse.json();
          setMindmaps(mindmapsData?.slice(0, 5) || []); // 只显示最近5个
        }

        // 获取用户积分
        const creditsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/credits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          setUserCredits(creditsData.balance || 0);
        }
      } catch (error) {
        console.error('获取用户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, user]);

  // 处理文本生成
  const handleTextGenerate = async () => {
    if (!textInput.trim()) {
      alert('请输入内容');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: textInput.trim()
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // 成功生成思维导图，跳转到详情页面
        router.push(`/mindmap/${result.data.mindmap_id}`);
      } else if (response.status === 402) {
        // 积分不足
        const errorDetail = result.detail;
        if (typeof errorDetail === 'object' && errorDetail.message === '积分不足') {
          const shortfall = errorDetail.required_credits - errorDetail.current_balance;
          alert(`积分不足！需要 ${errorDetail.required_credits} 积分，当前余额 ${errorDetail.current_balance} 积分，还差 ${shortfall} 积分。`);
        } else {
          alert('积分不足，无法生成思维导图');
        }
      } else {
        throw new Error(result.detail || '生成失败');
      }
    } catch (error) {
      console.error('文本处理错误:', error);
      alert(error.message || '生成思维导图时出现错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // 文件上传相关函数
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileAnalysis(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileAnalysis(files[0]);
    }
  };

  const validateFile = (file) => {
    const supportedFormats = ['.txt', '.md', '.docx', '.pdf', '.srt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!supportedFormats.includes(fileExt)) {
      throw new Error(`不支持的文件格式: ${fileExt}`);
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('文件大小超过10MB限制');
    }
    
    return true;
  };

  const handleFileAnalysis = async (file) => {
    try {
      validateFile(file);
      setIsAnalyzing(true);
      setFileAnalysis(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setFileAnalysis(result);
      } else {
        throw new Error(result.detail || '文件分析失败');
      }
    } catch (error) {
      console.error('文件分析错误:', error);
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileGenerate = async () => {
    if (!fileAnalysis?.file_token) return;

    try {
      setIsGenerating(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/generate-from-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_token: fileAnalysis.file_token
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // 成功生成思维导图，跳转到详情页面
        router.push(`/mindmap/${result.data.mindmap_id}`);
      } else if (response.status === 402) {
        // 积分不足
        const errorDetail = result.detail;
        if (typeof errorDetail === 'object' && errorDetail.message === '积分不足') {
          const shortfall = errorDetail.required_credits - errorDetail.current_balance;
          alert(`积分不足！需要 ${errorDetail.required_credits} 积分，当前余额 ${errorDetail.current_balance} 积分，还差 ${shortfall} 积分。`);
        } else {
          alert('积分不足，无法生成思维导图');
        }
      } else {
        throw new Error(result.detail || '生成失败');
      }
    } catch (error) {
      console.error('思维导图生成错误:', error);
      alert(error.message || '生成思维导图时出现错误，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

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
              <Link href="/settings" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm">
                <Gift className="w-4 h-4 text-orange-500" />
                <span>邀请好友</span>
              </Link>
              
              {/* 用户菜单 - 显示头像、积分余额和下拉菜单 */}
              <div className="relative" id="userMenuButton">
                <button className="flex items-center space-x-2">
                  {/* 用户头像 */}
                  <img className="w-9 h-9 rounded-full" src="https://placehold.co/40x40/111827/ffffff?text=U" alt="用户头像" />
                  {/* 积分余额显示 */}
                  <div className="flex items-center space-x-1 text-gray-800 font-semibold">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span>{userCredits}</span>
                  </div>
                </button>
                
                {/* 用户下拉菜单 - 默认隐藏，点击后显示 */}
                <div id="userMenu" className="hidden absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border">
                  {/* 用户信息展示 */}
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-gray-800">{user.display_name || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  {/* 功能菜单项 */}
                  <Link href="/mindmaps" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <LayoutDashboard className="w-4 h-4" /><span>我的思维导图</span>
                  </Link>
                  <Link href="/settings" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <CreditCard className="w-4 h-4" /><span>用量与计费</span>
                  </Link>
                  <Link href="/settings" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="w-4 h-4" /><span>账户设置</span>
                  </Link>
                  <div className="border-t my-1"></div>
                  <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                    <LogOut className="w-4 h-4" /><span>退出登录</span>
                  </button>
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
                <button 
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'text' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>长文本</span>
                </button>
                
                {/* 文档上传标签 */}
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'upload' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileUp className="w-4 h-4 text-green-500" />
                  <span>文档上传</span>
                </button>
                
                {/* 以下功能标记为开发中，暂时禁用 */}
                <button className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <FileAudio className="w-4 h-4 text-red-500" />
                  <span>YouTube</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
                
                <button className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <Podcast className="w-4 h-4 text-purple-500" />
                  <span>播客</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
                
                <button className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <FileAudio className="w-4 h-4 text-orange-500" />
                  <span>音频文件</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
                
                <button className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed" disabled>
                  <LinkIcon className="w-4 h-4 text-sky-500" />
                  <span>网页链接</span>
                  <span className="text-red-500 text-xs ml-1">(开发中)</span>
                </button>
              </div>
              
              {/* 标签内容区域 */}
              <div className="p-4">
                {/* 长文本输入内容区 */}
                {activeTab === 'text' && (
                  <div className="tab-content">
                    <textarea 
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition text-base" 
                      placeholder="在此处输入你的想法、粘贴长文本或链接..."
                    />
                    <div className="text-right mt-4">
                      <button 
                        onClick={handleTextGenerate}
                        disabled={!textInput.trim() || loading}
                        className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{loading ? '生成中...' : '生成'}</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 文档上传内容区 */}
                {activeTab === 'upload' && (
                  <div className="tab-content">
                    <div
                      className={`relative border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center text-center p-4 transition-colors ${
                        dragActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${isAnalyzing || isGenerating ? 'opacity-50 pointer-events-none' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept=".txt,.md,.docx,.pdf,.srt"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isAnalyzing || isGenerating}
                      />
                      
                      {fileAnalysis ? (
                        // 文件分析完成后显示文件信息
                        <div>
                          <div className="text-green-500 text-2xl mb-2">📄</div>
                          <p className="font-semibold text-gray-700">文档已解析完成</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {fileAnalysis.analysis?.text_length || 0} 字符 | 
                            预计消耗 {fileAnalysis.analysis?.estimated_cost || 0} 积分
                          </p>
                        </div>
                      ) : isAnalyzing ? (
                        // 分析中状态
                        <div>
                          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="font-semibold text-blue-700">正在分析文件...</p>
                        </div>
                      ) : isGenerating ? (
                        // 生成中状态
                        <div>
                          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="font-semibold text-blue-700">正在生成思维导图...</p>
                        </div>
                      ) : (
                        // 默认上传状态
                        <div>
                          <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="font-semibold text-gray-700">
                            {dragActive ? '释放文件以上传' : '将文件拖拽到此处或点击上传'}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            支持 TXT, MD, DOCX, PDF, SRT 格式，最大 10MB
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 积分成本信息 */}
                    {fileAnalysis && (
                      <div className={`mt-4 p-3 rounded-lg text-sm ${
                        fileAnalysis.analysis?.sufficient_credits
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        <div className="flex items-center">
                          <span className="mr-2">
                            {fileAnalysis.analysis?.sufficient_credits ? '✅' : '⚠️'}
                          </span>
                          <div>
                            <div className="font-medium">
                              预计消耗 {fileAnalysis.analysis?.estimated_cost || 0} 积分
                              {fileAnalysis.analysis?.sufficient_credits 
                                ? ' - 积分充足，可以生成' 
                                : ' - 积分不足，无法生成'
                              }
                            </div>
                            <div className="mt-1 text-xs opacity-75">
                              当前余额: {fileAnalysis.analysis?.user_balance || 0} 积分 | 
                              文本长度: {fileAnalysis.analysis?.text_length || 0} 字符
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-right mt-4">
                      <button 
                        onClick={fileAnalysis ? handleFileGenerate : () => document.querySelector('input[type="file"]').click()}
                        disabled={isAnalyzing || isGenerating || (fileAnalysis && !fileAnalysis.analysis?.sufficient_credits)}
                        className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {isGenerating ? '生成中...' : 
                           isAnalyzing ? '分析中...' : 
                           fileAnalysis ? '生成' : '选择文件'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
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
              <Link href="/mindmaps" className="text-sm font-semibold text-gray-600 hover:text-black">查看全部 &rarr;</Link>
            </div>
            
            {/* 项目卡片网格布局 - 响应式设计，支持不同屏幕尺寸 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {/* 创建新项目卡片 - 虚线边框的快捷入口 */}
              <div 
                onClick={() => router.push('/create')}
                className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-center h-full min-h-[196px] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-12 h-12 text-gray-400 mb-2" />
                <h3 className="font-semibold text-gray-600">创建新项目</h3>
              </div>
              
              {/* 用户的真实项目数据 */}
              {mindmaps.map((mindmap) => (
                <div 
                  key={mindmap.id}
                  onClick={() => router.push(`/mindmap/${mindmap.id}`)}
                  className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="bg-gray-200 h-32 flex items-center justify-center">
                    <img 
                      src="https://placehold.co/300x160/e5e7eb/111827?text=思维导图" 
                      alt="思维导图预览图" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 truncate" title={mindmap.title}>
                      {mindmap.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(mindmap.updated_at).toLocaleDateString('zh-CN')} 更新
                    </p>
                  </div>
                </div>
              ))}
              
              {/* 如果项目少于4个，显示空白占位卡片 */}
              {mindmaps.length < 4 && Array.from({ length: 4 - mindmaps.length }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 h-[196px] flex items-center justify-center">
                  <p className="text-gray-400 text-sm">等待创建...</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreationHub;
