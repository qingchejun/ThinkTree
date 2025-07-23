import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import { ToastContainer } from '../components/common/Toast'

export const metadata = {
  title: 'ThinkTree - AI驱动的思维导图生成工具',
  description: '将文档转换为专业思维导图，支持多种格式，一键分享',
  keywords: '思维导图,AI,文档解析,ReactFlow,用户认证',
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