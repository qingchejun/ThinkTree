/**
 * 导出菜单组件
 */
import { Download } from 'lucide-react';

export default function ExportMenu({ onExportSVG, onExportPNG, isExportingUI, showExportMenu, setShowExportMenu, onFeedback }) {
  return (
    <div className="relative">
      <button
        onClick={() => setShowExportMenu(!showExportMenu)} // Toggle menu visibility
        disabled={isExportingUI}
        className="action-button text-purple-500 hover:bg-purple-100 hover:text-purple-600 disabled:opacity-50"
        title="导出思维导图"
      >
        {isExportingUI ? (
          <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>

      {showExportMenu && !isExportingUI && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="py-2">
            <button
              onClick={() => {
                onExportSVG?.();
                onFeedback?.('已导出 SVG');
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v1m0 0h6m-6 0V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4H7" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">导出为 SVG</div>
                <div className="text-xs text-gray-500">矢量格式，可缩放</div>
              </div>
            </button>
            <button
              onClick={() => {
                onExportPNG?.();
                onFeedback?.('已导出 PNG');
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">导出为 PNG</div>
                <div className="text-xs text-gray-500">位图格式，高分辨率</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}