/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 React Strict Mode
  reactStrictMode: true,
  
  // 实验性功能：启用绝对导入
  experimental: {
    externalDir: true,
  },
  
  // 启用 SWC 压缩
  swcMinify: true,
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_NAME: 'ThinkSo',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // 图片优化
  images: {
    domains: [
      'api.dicebear.com',      // 用户头像生成服务
      'images.unsplash.com',   // 思维导图预览图
      'placehold.co'           // 备用占位符服务
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 重写规则
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ]
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // 移除 standalone 配置以修复 Render 部署问题
  // output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 严格模式
  poweredByHeader: false,
}

module.exports = nextConfig