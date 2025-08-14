/**
 * 思维导图头部组件
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Maximize, Minimize, Share2, Star, Trash2, Edit3, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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
  extraActions = [],
  onToggleEditMode,
  isEditMode = false,
}) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(mindmap.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    <div className="flex items-center justify-between px-6 py-4 border-b border-brand-200">
      <div className="flex items-center space-x-4 flex-1">
        <Button aria-label="返回控制台" onClick={() => router.push('/mindmaps')} variant="ghost" size="sm" className="p-2 text-brand-600 hover:bg-brand-100 hover:text-brand-800" title="返回控制台">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleSaveTitle}
                className="text-xl font-bold text-brand-900 bg-white border border-brand-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-core-500/20 focus:border-brand-500 min-w-0 flex-1"
                placeholder="请输入标题"
                autoFocus
                maxLength={100}
              />
              <Button aria-label="保存标题" onClick={handleSaveTitle} disabled={isSavingTitle} variant="ghost" size="sm" className="p-2 text-success-600 hover:bg-success-100 hover:text-success-700 disabled:opacity-50 disabled:cursor-not-allowed" title="保存标题">
                {isSavingTitle ? (
                  <div className="animate-spin w-4 h-4 border-2 border-success-600 border-t-transparent rounded-full"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button aria-label="取消编辑" onClick={handleCancelEditTitle} disabled={isSavingTitle} variant="ghost" size="sm" className="p-2 text-error-600 hover:bg-error-100 hover:text-error-700 disabled:opacity-50 disabled:cursor-not-allowed" title="取消编辑">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-xl font-bold text-brand-900 truncate cursor-pointer hover:text-core-600 hover:underline transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="点击编辑标题"
            >
              {mindmap.title}
            </h1>
          )}
          <p className="text-sm text-brand-500 mt-1">
            创建于 {formatDate(mindmap.created_at)}
            {mindmap.updated_at !== mindmap.created_at && (
              <span> · 更新于 {formatDate(mindmap.updated_at)}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isEditMode && (
          <Badge size="xs" className="bg-collaboration-100 text-collaboration-700 border border-collaboration-200">
            编辑模式
          </Badge>
        )}
        {extraActions.map((el, idx) => (
          <span key={idx}>{el}</span>
        ))}
        {onToggleEditMode && (
          <Button aria-label={isEditMode ? '退出编辑模式' : '进入编辑模式'} onClick={onToggleEditMode} variant="ghost" size="sm" className={`p-2 hidden sm:inline-flex ${isEditMode ? 'text-collaboration-600 bg-collaboration-50' : 'text-brand-500 hover:bg-brand-100 hover:text-collaboration-600'}`} title={isEditMode ? '退出编辑模式' : '进入编辑模式'}>
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
        <Button aria-label={isFullscreen ? '退出全屏' : '进入全屏'} onClick={onToggleFullscreen} variant="ghost" size="sm" className="p-2 hidden sm:inline-flex text-content-600 hover:bg-content-100 hover:text-content-700" title={isFullscreen ? '退出全屏' : '进入全屏'}>
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>

        <ExportMenu
          onExportSVG={onExportSVG}
          onExportPNG={onExportPNG}
          isExportingUI={isExportingUI}
          showExportMenu={showExportMenu} // 传递给子组件
          setShowExportMenu={setShowExportMenu} // 传递给子组件
          ariaLabel="导出思维导图"
        />

        <Button aria-label="分享思维导图" onClick={onShare} variant="ghost" size="sm" className="p-2 hidden sm:inline-flex text-collaboration-600 hover:bg-collaboration-100 hover:text-collaboration-700" title="分享思维导图">
          <Share2 className="w-4 h-4" />
        </Button>

        <Button aria-label={isFavorited ? '取消收藏' : '收藏'} onClick={onToggleFavorite} variant="ghost" size="sm" className={`p-2 hidden sm:inline-flex ${isFavorited ? 'text-accent-600 hover:bg-accent-100 hover:text-accent-700' : 'text-brand-400 hover:bg-brand-100 hover:text-accent-600'}`} title={isFavorited ? '取消收藏' : '收藏'}>
          {isFavorited ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
        </Button>

        <Button aria-label="删除思维导图" onClick={onDelete} variant="ghost" size="sm" className="p-2 hidden sm:inline-flex text-error-600 hover:bg-error-100 hover:text-error-700" title="删除思维导图">
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* 移动端更多菜单 */}
        <div className="relative sm:hidden">
          <Button aria-label="更多操作" onClick={() => setShowMoreMenu((v) => !v)} variant="ghost" size="sm" className="p-2 text-brand-600 hover:bg-brand-100 hover:text-brand-800" title="更多操作">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-brand-200 z-50 overflow-hidden">
              <div className="py-1">
                {onToggleEditMode && (
                  <button onClick={() => { setShowMoreMenu(false); onToggleEditMode(); }} className="w-full text-left px-4 py-2 text-sm text-brand-700 hover:bg-brand-50">
                    {isEditMode ? '退出编辑模式' : '进入编辑模式'}
                  </button>
                )}
                <button onClick={() => { setShowMoreMenu(false); onToggleFullscreen(); }} className="w-full text-left px-4 py-2 text-sm text-content-700 hover:bg-content-50">{isFullscreen ? '退出全屏' : '进入全屏'}</button>
                <button onClick={() => { setShowMoreMenu(false); onShare(); }} className="w-full text-left px-4 py-2 text-sm text-collaboration-700 hover:bg-collaboration-50">分享</button>
                <button onClick={() => { setShowMoreMenu(false); onToggleFavorite(); }} className="w-full text-left px-4 py-2 text-sm text-accent-700 hover:bg-accent-50">{isFavorited ? '取消收藏' : '收藏'}</button>
                <button onClick={() => { setShowMoreMenu(false); onExportPNG(); }} className="w-full text-left px-4 py-2 text-sm text-content-700 hover:bg-brand-50">导出 PNG</button>
                <button onClick={() => { setShowMoreMenu(false); onExportSVG(); }} className="w-full text-left px-4 py-2 text-sm text-core-700 hover:bg-brand-50">导出 SVG</button>
                <button onClick={() => { setShowMoreMenu(false); onDelete(); }} className="w-full text-left px-4 py-2 text-sm text-error-700 hover:bg-error-50">删除</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}