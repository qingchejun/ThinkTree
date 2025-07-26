import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import { ToastContainer } from '../components/common/Toast'

export const metadata = {
  title: 'ThinkSo - AI驱动的思维导图生成工具',
  description: '将文档转换为专业思维导图，支持多种格式，一键分享',
  keywords: '思维导图,AI,文档解析,ReactFlow,用户认证',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧠</text></svg>', type: 'image/svg+xml' }
    ]
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AuthProvider>
          <div id="root">
            {children}
          </div>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  )
}