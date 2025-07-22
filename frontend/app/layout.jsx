import '../styles/globals.css'

export const metadata = {
  title: 'ThinkTree - AI驱动的思维导图生成工具',
  description: '将文档转换为专业思维导图，支持多种格式，一键分享',
  keywords: '思维导图,AI,文档解析,ReactFlow',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}