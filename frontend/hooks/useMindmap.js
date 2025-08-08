/**
 * 自定义 Hook - useMindmap
 * 封装获取和管理单个思维导图数据的逻辑
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx' // 注意路径和文件扩展名
import { getMindMap } from '../lib/api'

export function useMindmap(mindmapId) {
  const { user } = useAuth()
  const [mindmap, setMindmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMindmap = async () => {
      if (!mindmapId || !user) return
      try {
        setLoading(true)
        setError(null)
        const data = await getMindMap(mindmapId)
        setMindmap(data)
      } catch (err) {
        if (err.code === 404) {
          setError('思维导图不存在或您无权访问')
        } else if (err.code === 402) {
          setError('积分不足，请先充值或兑换积分')
        } else {
          setError(err.message || '获取思维导图失败')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMindmap()
  }, [user, mindmapId])

  const stableMindmapData = useMemo(() => {
    return mindmap ? {
      title: mindmap.title,
      markdown: mindmap.content
    } : null
  }, [mindmap?.title, mindmap?.content])

  return { mindmap, setMindmap, loading, error, setError, stableMindmapData }
}