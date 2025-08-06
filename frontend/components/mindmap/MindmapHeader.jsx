/**
 * 思维导图头部组件
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Maximize, Minimize, Share2, Star, Trash2 } from 'lucide-react';
import ExportMenu from './ExportMenu.jsx'; // 注意路径和文件扩展名

export default function MindmapHeader({
  mindmap,
  onUpdateTitle,
  onDelete,
  onShare,
  onToggleFavorite,
  isFavorited,
  onExportSVG,
  onExportPNG,
  isExportingUI,
  isFullscreen,
  onToggleFullscreen,
  showExportMenu, // 从父组件接收
  setShowExportMenu, // 从父组件接收
}) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(mindmap.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const handleSaveTitle = async () => {
    if (isSavingTitle) return;
    if (!editingTitle.trim()) return;
    if (editingTitle.trim() === mindmap.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    await onUpdateTitle(editingTitle.trim());
    setIsSavingTitle(false);
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(mindmap.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditTitle();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <div className="flex items-center space-x-4 flex-1">
        <button
          onClick={() => router.push('/mindmaps')}
          className="action-button text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          title="返回控制台"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleSaveTitle}
                className="text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 flex-1"
                placeholder="请输入标题"
                autoFocus
                maxLength={100}
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="action-button text-green-500 hover:bg-green-100 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="保存标题"
              >
                {isSavingTitle ? (
                  <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancelEditTitle}
                disabled={isSavingTitle}
                className="action-button text-red-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="取消编辑"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h1
              className="text-xl font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 hover:underline transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="点击编辑标题"
            >
              {mindmap.title}
            </h1>
          )}
          <p className="text-sm text-gray-500 mt-1">
            创建于 {formatDate(mindmap.created_at)}
            {mindmap.updated_at !== mindmap.created_at && (
              <span> · 更新于 {formatDate(mindmap.updated_at)}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleFullscreen}
          className="action-button text-green-500 hover:bg-green-100 hover:text-green-600"
          title={isFullscreen ? "退出全屏" : "进入全屏"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        <ExportMenu
          onExportSVG={onExportSVG}
          onExportPNG={onExportPNG}
          isExportingUI={isExportingUI}
          showExportMenu={showExportMenu} // 传递给子组件
          setShowExportMenu={setShowExportMenu} // 传递给子组件
        />

        <button
          onClick={onShare}
          className="action-button text-blue-500 hover:bg-blue-100 hover:text-blue-600"
          title="分享思维导图"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFavorite}
          className={`action-button ${isFavorited ? 'text-yellow-500 hover:bg-yellow-100 hover:text-yellow-600' : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'}`}
          title={isFavorited ? '取消收藏' : '收藏'}
        >
          {isFavorited ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
        </button>

        <button
          onClick={onDelete}
          className="action-button text-red-500 hover:bg-red-100 hover:text-red-600"
          title="删除思维导图"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}