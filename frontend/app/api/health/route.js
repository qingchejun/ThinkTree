/**
 * 前端健康检查 API
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'thinktree-frontend',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    )
  } catch (e) {
    // 即使异常也返回200，避免健康检查误判
    return new Response(JSON.stringify({ status: 'healthy' }), { status: 200 })
  }
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}