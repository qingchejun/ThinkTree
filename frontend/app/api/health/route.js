/**
 * 前端健康检查 API
 */
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'thinktree-frontend',
    version: '1.0.0'
  })
}