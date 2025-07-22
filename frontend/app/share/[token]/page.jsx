/**
 * 分享页面
 */
'use client'

export default function SharePage({ params }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              分享的思维导图
            </h1>
            <p className="text-gray-600 mb-4">
              Token: {params?.token || '未知'}
            </p>
            <p className="text-gray-600 mb-8">
              分享功能开发中，敬请期待
            </p>
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-500"
            >
              ← 返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}