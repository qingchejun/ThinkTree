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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import ShareModal from './share/ShareModal';
import MindmapThumbnail from './mindmap/MindmapThumbnail';
import { Gift, Zap, LayoutDashboard, CreditCard, Settings, LogOut, FileText, FileUp, Youtube, Podcast, FileAudio, Link as LinkIcon, Sparkles, UploadCloud, PlusCircle, ListChecks, ArrowRight, Eye, Trash2, Share2, FileX, Plus, File, Download } from 'lucide-react';

// 头像相关功能已移至 Navbar 组件

// ===================================================================
// ======================= 自定义 HOOKS ==============================
// ===================================================================

// 自定义Hook：用于处理异步操作
const useAsync = (asyncFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};

// 自定义Hook：用于API调用
const useApi = () => {
  const apiCall = async (url, options = {}) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  return { apiCall };
};


// ===================================================================
// ======================= 骨架屏组件 =================================
// ===================================================================
const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header骨架屏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Main内容骨架屏 */}
      <div className="container mx-auto px-6 py-8">
        <div className="w-full max-w-5xl mx-auto">
          <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mx-auto mb-6"></div>
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex justify-center space-x-4 mb-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="w-full h-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* 项目骨架屏 */}
        <div className="w-full max-w-6xl mx-auto mt-12">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden">
                <div className="bg-gray-200 h-32 animate-pulse"></div>
                <div className="p-4">
                  <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// ======================= 错误边界组件 ===============================
// ===================================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CreationHub Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">出现了一些问题</h2>
            <p className="text-gray-600 mb-6">页面加载时发生错误，请刷新页面重试</p>
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



// ===================================================================
// ======================= 2. 子组件：创作面板 ==========================
// ===================================================================
const CreationPanel = React.memo(({ onCreate, loading }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleCreate = () => {
    if (activeTab === 'text' && text.trim()) {
      onCreate({ type: 'text', content: text });
    } else if (activeTab === 'upload' && file) {
      onCreate({ type: 'file', content: file });
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const tabs = [
    { id: 'text', name: '长文本', icon: FileText, color: '#4A90E2' },
    { id: 'upload', name: '文档上传', icon: FileUp, color: '#50E3C2', disabled: false },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000', disabled: true },
    { id: 'podcast', name: '播客', icon: Podcast, color: '#9013FE', disabled: true },
    { id: 'audio', name: '音频文件', icon: FileAudio, color: '#F5A623', disabled: true },
    { id: 'link', name: '网页链接', icon: LinkIcon, color: '#7ED321', disabled: true },
  ];

  return (
    <div id="creationView" className="w-full max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">今天我们创造些什么？</h1>
        <p className="text-gray-500 mb-8">从一个想法开始，或从多种来源导入</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border p-2">
        <div className="flex justify-center border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out \
                ${
                  activeTab === tab.id
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-500 hover:text-black'
                }
                ${tab.disabled ? 'cursor-not-allowed opacity-50' : ''}`
              }
              disabled={tab.disabled}
            >
              <tab.icon className="w-5 h-5" color={activeTab === tab.id ? 'currentColor' : tab.color} />
              <span>{tab.name}</span>
              {tab.disabled && <span className="text-xs text-gray-400">(开发中)</span>}
            </button>
          ))}
        </div>

        <div className="p-6 flex flex-col">
          <div className="flex-grow">
            {activeTab === 'text' && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="在此处输入你的想法、粘贴长文本或链接..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
              />
            )}
            {activeTab === 'upload' && (
              <div className="h-40">
                {!file ? (
                  <div 
                    onDragOver={(e) => {e.preventDefault(); e.stopPropagation(); setDragActive(true);}} 
                    onDragLeave={(e) => {e.preventDefault(); e.stopPropagation(); setDragActive(false);}} 
                    onDrop={handleDrop} 
                    className={`relative flex flex-col items-center justify-center h-full text-center p-4 border-2 border-dashed rounded-lg transition-colors duration-300 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                    <UploadCloud className="mx-auto h-10 w-10 text-blue-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">将文件拖放到此处</h3>
                    <p className="mt-1 text-xs text-gray-600">或</p>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                        选择文件
                    </button>
                    <p className="mt-3 text-xs text-gray-500">支持 PDF, DOCX, TXT 等格式</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <File className="mx-auto h-10 w-10 text-green-500" />
                    <p className="mt-2 font-semibold text-gray-800 truncate max-w-full px-4">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    <button onClick={() => setFile(null)} className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
                      移除文件
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleCreate}
              disabled={loading || (activeTab === 'text' && !text.trim()) || (activeTab === 'upload' && !file)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-lg shadow-md text-white bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  处理中...
                </>
              ) : (
                <> 
                  <Sparkles className="-ml-1 mr-2 h-5 w-5 text-yellow-500" />
                  开始创作
                </> 
               )}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
});

CreationPanel.displayName = 'CreationPanel';

// ===================================================================
// ======================= 3. 子组件：最近项目 ========================
// ===================================================================
const RecentProjects = React.memo(({ mindmaps, onCardClick, onCreateNew, loading = false }) => {
    const router = useRouter();

    // 分享模态框状态
    const [shareModal, setShareModal] = useState({
      isOpen: false,
      mindmapId: null,
      mindmapTitle: ''
    });

    // 删除确认弹窗状态
    const [deleteModal, setDeleteModal] = useState({
      isOpen: false,
      mindmapId: null,
      mindmapTitle: '',
      isDeleting: false
    });

    const handleCardClick = (id) => {
      router.push(`/mindmap/${id}`);
    };

    const handleCreateNew = () => {
      router.push('/create');
    };

    const handleView = (e, id) => {
      e.stopPropagation(); // 防止触发卡片点击
      router.push(`/mindmap/${id}`);
    };

    const handleDelete = (e, mindmap) => {
      e.stopPropagation(); // 防止触发卡片点击
      setDeleteModal({
        isOpen: true,
        mindmapId: mindmap.id,
        mindmapTitle: mindmap.title,
        isDeleting: false
      });
    };

    // 确认删除
    const confirmDelete = async () => {
      if (!deleteModal.mindmapId) return;

      try {
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${deleteModal.mindmapId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // 从列表中移除已删除的思维导图
          window.location.reload();
        } else {
          console.error('删除思维导图失败:', response.status);
          alert('删除失败，请重试');
        }
      } catch (error) {
        console.error('删除思维导图失败:', error);
        alert('删除失败，请重试');
      } finally {
        setDeleteModal({
          isOpen: false,
          mindmapId: null,
          mindmapTitle: '',
          isDeleting: false
        });
      }
    };

    // 取消删除
    const cancelDelete = () => {
      setDeleteModal({
        isOpen: false,
        mindmapId: null,
        mindmapTitle: '',
        isDeleting: false
      });
    };

    // 处理分享点击
    const handleShare = (e, mindmap) => {
      e.stopPropagation(); // 防止触发卡片点击
      setShareModal({
        isOpen: true,
        mindmapId: mindmap.id,
        mindmapTitle: mindmap.title
      });
    };

    // 处理PNG导出 - 优化版本
    const handleExport = async (e, mindmap) => {
      e.stopPropagation();
      
      try {
        console.log(`开始导出思维导图 (PNG):`, mindmap.title);
        
        // 使用try-catch包装动态导入，避免chunk加载问题
        let Markmap, Transformer, exportPNG, getSafeFilename, getTimestamp;
        
        try {
          // 分别导入，更容易定位问题
          const markmapViewModule = await import('markmap-view');
          Markmap = markmapViewModule.Markmap;
          
          const markmapLibModule = await import('markmap-lib');
          Transformer = markmapLibModule.Transformer;
          
          const exportUtilsModule = await import('../lib/exportUtils.js');
          exportPNG = exportUtilsModule.exportPNG;
          getSafeFilename = exportUtilsModule.getSafeFilename;
          getTimestamp = exportUtilsModule.getTimestamp;
        } catch (importError) {
          console.error('导入模块失败:', importError);
          // 回退到markdown导出
          const blob = new Blob([mindmap.content], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${mindmap.title}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('已回退到Markdown导出');
          return;
        }
        
        // 创建临时SVG容器
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.width = '1600px';
        tempContainer.style.height = '1200px';
        document.body.appendChild(tempContainer);
        
        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        tempSvg.setAttribute('width', '1600');
        tempSvg.setAttribute('height', '1200');
        tempContainer.appendChild(tempSvg);
        
        try {
          // 转换markdown内容
          const transformer = new Transformer();
          const { root } = transformer.transform(mindmap.content);
          
          // 创建markmap实例
          const markmapInstance = Markmap.create(tempSvg, {
            duration: 0,
            maxWidth: 400,
            spacingVertical: 8,
            spacingHorizontal: 120,
            autoFit: true,
            pan: false,
            zoom: false,
          });
          
          // 渲染思维导图
          markmapInstance.setData(root);
          markmapInstance.fit();
          
          // 等待渲染完成
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // 生成文件名
          const safeTitle = getSafeFilename(mindmap.title);
          const timestamp = getTimestamp();
          const filename = `${safeTitle}_${timestamp}`;
          
          // 导出PNG
          const result = await exportPNG(markmapInstance, filename, 4);
          
          if (result.success) {
            console.log(`PNG文件导出成功: ${result.filename}`);
          } else {
            throw new Error(result.error);
          }
          
        } finally {
          // 清理临时元素
          document.body.removeChild(tempContainer);
        }
        
      } catch (error) {
        console.error('导出思维导图失败:', error);
        alert(`导出失败: ${error.message}`);
      }
    };

    // 关闭分享模态框
    const handleCloseShareModal = () => {
      setShareModal({
        isOpen: false,
        mindmapId: null,
        mindmapTitle: ''
      });
    };

    return (
      <div id="dashboardView" className="w-full max-w-6xl mx-auto mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">我的思维导图</h2>
          {mindmaps && mindmaps.length > 0 && (
            <Link href="/mindmaps" className="text-sm font-semibold text-gray-600 hover:text-black flex items-center space-x-1">
              <span>查看全部</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* 新建导图卡片 */}
            <div className="cursor-pointer group bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 h-full min-h-[200px]">
              <PlusCircle className="w-12 h-12 text-green-500 transition-colors mb-3"/>
              <h3 className="font-semibold text-gray-600 transition-colors text-lg">新建导图</h3>
            </div>
            {/* 加载骨架屏 */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl border overflow-hidden min-h-[200px] animate-pulse animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <div className="bg-gray-200 h-32 animate-shimmer"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-shimmer"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        ) : mindmaps && mindmaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* 创建新项目卡片 */}
            <div onClick={onCreateNew} 
                 className="cursor-pointer group bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300 flex flex-col items-center justify-center p-6 h-full min-h-[200px] animate-fade-in-up hover:scale-105">
              <PlusCircle className="w-12 h-12 text-green-500 group-hover:text-blue-500 transition-all duration-300 animate-float"/>
              <h3 className="font-semibold text-gray-600 group-hover:text-blue-600 transition-colors text-lg">新建导图</h3>
            </div>

            {/* 项目卡片 */}
            {mindmaps.map((mindmap, index) => (
              <div 
                key={mindmap.id} 
                className="project-card group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div onClick={() => onCardClick(mindmap.id)} className="flex-grow cursor-pointer">
                  {/* 动态预览图 */}
                  <div className="card-preview h-32 overflow-hidden relative transition-transform duration-300">
                    <MindmapThumbnail 
                      content={mindmap.content_preview || mindmap.content} 
                      title={mindmap.title}
                      className="w-full h-full"
                    />
                    {/* 悬停遮罩效果 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="card-title font-semibold text-gray-800 truncate transition-colors duration-200" title={mindmap.title}>
                      {mindmap.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(mindmap.updated_at).toLocaleDateString('zh-CN')} 更新
                    </p>
                  </div>
                </div>
                <div className="card-actions border-t border-gray-100 p-3 flex justify-end space-x-2 bg-gray-50/50 transition-all duration-300">
                  <button 
                    onClick={(e) => handleView(e, mindmap.id)} 
                    className="action-button text-green-500 hover:bg-green-100 hover:text-green-600"
                    title="查看思维导图"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                     onClick={(e) => handleExport(e, mindmap)} 
                     className="action-button text-purple-500 hover:bg-purple-100 hover:text-purple-600"
                     title="导出为PNG图片"
                   >
                     <Download className="w-4 h-4" />
                   </button>
                  <button 
                    onClick={(e) => handleShare(e, mindmap)} 
                    className="action-button text-blue-500 hover:bg-blue-100 hover:text-blue-600"
                    title="分享思维导图"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, mindmap)} 
                    className="action-button text-red-500 hover:bg-red-100 hover:text-red-600"
                    title="删除思维导图"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
              <FileX className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">还没有任何项目</h3>
              <p className="mt-2 text-sm text-gray-500">点击下面的按钮，开始你的第一次创作吧！</p>
              <div className="mt-6">
                <button onClick={onCreateNew} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  新建导图
                </button>
              </div>
          </div>
        )}
        
        {/* 分享模态框 */}
        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={handleCloseShareModal}
          mindmapId={shareModal.mindmapId}
          mindmapTitle={shareModal.mindmapTitle}
        />



        {/* 删除确认弹窗 */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                  <p className="text-sm text-gray-500">此操作无法撤销</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                确定要删除思维导图 <span className="font-semibold">&ldquo;{deleteModal.mindmapTitle}&rdquo;</span> 吗？
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deleteModal.isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      删除中...
                    </>
                  ) : (
                    '确认删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

RecentProjects.displayName = 'RecentProjects';


// ===================================================================
// ======================= 4. 主组件：创作中心 ========================
// ===================================================================
const DashboardClient = ({ initialData }) => {
  const { logout, isLoading, user } = useAuth();
  const router = useRouter();
  const { apiCall } = useApi();

  // 状态管理
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const { loading: createMindMapLoading, execute: createMindMap } = useAsync(async (data) => {
    return await apiCall('/api/mindmaps/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });

  // 获取用户思维导图列表
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setProjects([]);
        setProjectsLoading(false);
        return;
      }

      try {
        setProjectsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // 适配新的分页响应结构 { items, has_next, next_cursor }
          const items = Array.isArray(data) ? data : (data?.items || []);
          setProjects(items.slice(0, 9));
        } else {
          console.error('获取思维导图列表失败:', response.status);
          setProjects([]);
        }
      } catch (err) {
        console.error('获取思维导图列表失败:', err);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleCreateMindMap = async (creationData) => {
    try {
      const newMindMap = await createMindMap(creationData);
      if (newMindMap && newMindMap.id) {
        router.push(`/mindmap/${newMindMap.id}`);
      }
    } catch (error) {
      console.error('Failed to create mind map:', error);
    }
  };

  // 未登录用户自动跳转到首页并打开登录弹窗
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login');
    }
  }, [user, isLoading, router]);

  // 正在加载认证状态时显示骨架屏
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 未登录用户显示骨架屏（跳转过程中的短暂状态）
  if (!user) {
    return <LoadingSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-6 py-8">
          <CreationPanel onCreate={handleCreateMindMap} loading={createMindMapLoading} />
          <RecentProjects mindmaps={projects} onCardClick={(id) => router.push(`/mindmap/${id}`)} onCreateNew={() => router.push('/create')} loading={projectsLoading} />
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardClient;