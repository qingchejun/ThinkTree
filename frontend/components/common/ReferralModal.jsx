'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Link as LinkIcon, Users, Info } from 'lucide-react'

export default function ReferralModal({ isOpen, onClose }) {
  const [linkInfo, setLinkInfo] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/referrals/me/link`, {
          credentials: 'include'
        })
        if (!res.ok) throw new Error('加载失败')
        const data = await res.json()
        setLinkInfo(data)
      } catch (e) {
        setLinkInfo({ error: e.message })
      }
    })()
  }, [isOpen])

  const copy = async () => {
    if (!linkInfo?.referral_link) return
    try {
      await navigator.clipboard.writeText(linkInfo.referral_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  if (!isOpen) return null

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-[92vw] max-w-[560px] max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="关闭">✕</button>
        <h3 className="text-2xl font-bold text-center mb-2">邀请好友</h3>
        {!linkInfo && <div className="text-gray-500 text-center py-6">加载中...</div>}
        {linkInfo && !linkInfo.error && (
          <div>
            <div className="flex items-start gap-2 text-gray-600 mb-5">
              <Info className="w-5 h-5 mt-[2px] text-gray-500" />
              <p className="leading-relaxed">
                与好友分享您的专属邀请链接——当他们注册时，你们每人将获得100个奖励积分。
              </p>
            </div>
            <div className="mt-2 p-4 border rounded-xl bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <LinkIcon className="w-4 h-4" />
                <span>我的邀请链接</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono text-sm break-all text-gray-900 select-all">{linkInfo.referral_link || '生成中...'}</span>
                <button onClick={copy} disabled={!linkInfo?.referral_link || linkInfo.reached_limit} className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 disabled:opacity-50 transition-colors" title={linkInfo.reached_limit ? '已达上限' : '复制'}>
                  <Copy className="w-4 h-4 text-gray-700 hover:text-gray-900" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>
                  已邀请 {linkInfo.invited_count}/{linkInfo.limit}
                  {linkInfo.reached_limit ? ' · 邀请名额已满，如需提升请联系管理员' : ''}
                </span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              <a href="https://thinkso.io/settings?tab=invitations" className="underline hover:text-gray-800" target="_blank" rel="noreferrer">邀请记录</a> 可在个人中心查看
            </div>
          </div>
        )}
        {linkInfo?.error && <div className="text-red-600 text-center">{linkInfo.error}</div>}
      </div>
    </div>
  )

  return createPortal(modal, typeof window !== 'undefined' ? document.body : (typeof global !== 'undefined' ? global.document?.body : null))
}


