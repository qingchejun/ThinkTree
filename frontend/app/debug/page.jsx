'use client'

export default function DebugPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">调试信息</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">API URL:</h3>
            <p className="bg-gray-100 p-2 rounded font-mono text-sm">
              {process.env.NEXT_PUBLIC_API_URL || '未设置'}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700">环境:</h3>
            <p className="bg-gray-100 p-2 rounded font-mono text-sm">
              {process.env.NODE_ENV || '未设置'}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700">测试API连接:</h3>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
                  const data = await response.json()
                  alert(`API响应: ${JSON.stringify(data)}`)
                } catch (error) {
                  alert(`API连接失败: ${error.message}`)
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              测试API连接
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}