// API 基础封装：统一超时/重试、HttpOnly Cookie、错误对象

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const DEFAULT_FETCH_OPTIONS = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(id)
  }
}

async function getWithRetry(url, config, maxRetries = 2) {
  let attempt = 0
  let lastError = null
  while (attempt <= maxRetries) {
    try {
      const resp = await fetchWithTimeout(url, config, 15000)
      return resp
    } catch (err) {
      lastError = err
      attempt += 1
      if (attempt > maxRetries) break
      const backoff = 300 * Math.pow(2, attempt - 1) + Math.random() * 200
      await new Promise(r => setTimeout(r, backoff))
    }
  }
  throw lastError || new Error('网络错误')
}

export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers: { ...DEFAULT_FETCH_OPTIONS.headers, ...options.headers },
  }
  try {
    const isGet = (config.method || 'GET').toUpperCase() === 'GET'
    const response = isGet ? await getWithRetry(url, config, 2) : await fetchWithTimeout(url, config, options.timeoutMs || 15000)

    if (response.status === 401) {
      // 直接抛错，前端统一走刷新或重定向逻辑
      const retryData = await response.json().catch(() => ({}))
      const err = new Error(retryData.detail || '未认证')
      err.code = 401
      err.meta = retryData || {}
      throw err
    }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 402) {
        const err = new Error(data?.message || '积分不足')
        err.code = 402
        err.meta = data || {}
        throw err
      }
      const err = new Error(data.detail || data.message || '请求失败')
      err.code = response.status
      err.meta = data || {}
      throw err
    }
    return data
  } catch (error) {
    // 统一错误对象：{ message, code?, meta? }
    if (!(error instanceof Error)) {
      const e = new Error('未知错误')
      e.meta = error
      throw e
    }
    throw error
  }
}

export function subscribeTaskSSE(taskId, { onMessage, onError }) {
  try {
    const url = `${API_BASE_URL}/api/tasks/${taskId}/stream`
    const es = new EventSource(url, { withCredentials: true })
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data.replace(/^data:\s*/, ''))
        onMessage && onMessage(data)
      } catch (e) {
        onMessage && onMessage(evt.data)
      }
    }
    es.onerror = (err) => {
      onError && onError(err)
      es.close()
    }
    return () => es.close()
  } catch (e) {
    onError && onError(e)
    return () => {}
  }
}

export async function getTaskStatus(taskId) {
  return await apiCall(`/api/tasks/${taskId}`)
}

export async function secureFetch(url, options = {}) {
  const config = {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers: { ...DEFAULT_FETCH_OPTIONS.headers, ...options.headers },
  }
  return await fetch(url, config)
}


