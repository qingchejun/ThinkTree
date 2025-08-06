/**
 * 自定义 Hook - useMindmap
 * 封装获取和管理单个思维导图数据的逻辑
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx' // 注意路径和文件扩展名

export function useMindmap(mindmapId) {
  const { token } = useAuth()
  const [mindmap, setMindmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMindmap = async () => {
      if (!mindmapId || !token) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mindmaps/${mindmapId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setMindmap(data)
        } else if (response.status === 404) {
          setError('思维导图不存在或您无权访问')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || '获取思维导图失败')
        }
      } catch (err) {
        console.error('获取思维导图失败:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMindmap()
  }, [token, mindmapId])

  const stableMindmapData = useMemo(() => {
    return mindmap ? {
      title: mindmap.title,
      markdown: mindmap.content
    } : null
  }, [mindmap?.title, mindmap?.content])

  return { mindmap, setMindmap, loading, error, setError, stableMindmapData }
}