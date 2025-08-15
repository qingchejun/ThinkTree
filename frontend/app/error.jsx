/**
 * 错误处理页面
 */
'use client'

export default function Error({ error, reset }) {
  // 将错误完整打印到控制台，便于线上调试
  try {
    // 避免在SSR阶段执行
    if (typeof window !== 'undefined') {
      console.error('[AppErrorBoundary] 捕获到渲染错误:', error)
      if (error?.digest) {
        console.error('[AppErrorBoundary] digest:', error.digest)
      }
      if (error?.stack) {
        console.error('[AppErrorBoundary] stack:', error.stack)
      }
    }
  } catch {}
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">错误</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">页面加载失败</h2>
        <p className="text-gray-600 mb-8">
          {error?.message || '发生了未知错误'}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            重试
          </button>
          <a
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}