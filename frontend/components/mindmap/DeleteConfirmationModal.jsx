
/**
 * 删除确认弹窗组件
 */

import { Trash2 } from 'lucide-react'

export default function DeleteConfirmationModal({ isOpen, isDeleting, onConfirm, onCancel, mindmapTitle }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mr-4 ring-4 ring-red-100">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">确认删除</h3>
              <p className="text-sm text-gray-500">此操作不可撤销</p>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-100">
            <p className="text-red-800 text-sm leading-relaxed">
              确定要删除思维导图 <span className="font-semibold text-red-900">"{mindmapTitle}"</span> 吗？
            </p>
            <p className="text-red-600 text-xs mt-2">
              ⚠️ 警告：删除后将无法恢复，请谨慎操作
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="action-button text-gray-600 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 px-4 py-2 text-sm font-medium"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="action-button text-red-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 px-4 py-2 text-sm font-medium flex items-center bg-red-500 text-white hover:bg-red-600 hover:text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  确认删除
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

