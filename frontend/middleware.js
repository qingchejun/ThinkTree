import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl

  // /create -> /new 永久重定向（308）
  if (pathname === '/create') {
    const url = request.nextUrl.clone()
    url.pathname = '/new'
    return NextResponse.redirect(url, 308)
  }

  // 支持新前缀 /referralCode=<CODE>
  if (pathname.startsWith('/referralCode=')) {
    const code = pathname.split('=')[1] || ''
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('invitation_code', code)
    url.searchParams.set('auto_register', 'true')
    // 使用重定向以便地址栏携带查询参数，前端可感知
    return NextResponse.redirect(url)
  }

  // 兼容旧路径 /register?invitation_code= 仍然保留其现有页面逻辑
  // 也支持 /register/<code> 的容错跳转（如果未来有人误用）
  if (pathname.startsWith('/register/')) {
    const code = pathname.split('/register/')[1]
    if (code) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('invitation_code', code)
      url.searchParams.set('auto_register', 'true')
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/create',
    '/referralCode=:path*',
    '/register/:path*'
  ]
}


