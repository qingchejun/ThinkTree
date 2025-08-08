/**
 * 自定义 Hook - useMindmap
 * 封装获取和管理单个思维导图数据的逻辑
 */
'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMindmap } from '../lib/api/mindmaps'
import { useAuth } from '../context/AuthContext.jsx'

export function useMindmap(mindmapId) {
  const { user } = useAuth()
  const enabled = Boolean(mindmapId && user)
  const query = useQuery({
    queryKey: ['mindmap', mindmapId],
    queryFn: () => getMindmap(mindmapId),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const stableMindmapData = useMemo(() => {
    const m = query.data
    return m ? { title: m.title, markdown: m.content } : null
  }, [query.data?.title, query.data?.content])

  return { mindmap: query.data, setMindmap: () => {}, loading: query.isLoading, error: query.error, setError: () => {}, stableMindmapData }
}