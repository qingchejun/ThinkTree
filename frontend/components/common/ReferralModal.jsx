'use client'

import React, { useEffect, useState } from 'react'

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-lg max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">邀请好友</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {!linkInfo && <div className="text-gray-500">加载中...</div>}
        {linkInfo && !linkInfo.error && (
          <div>
            <p className="text-gray-700 mb-2">{linkInfo.rule_text}</p>
            <div className="mt-3 p-3 border rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">我的邀请链接</div>
              <div className="flex items-center gap-2">
                <input readOnly value={linkInfo.referral_link || ''} className="flex-1 px-3 py-2 border rounded" placeholder="生成中..." />
                <button onClick={copy} disabled={!linkInfo?.referral_link} className="px-3 py-2 text-sm bg-black text-white rounded disabled:opacity-50">{copied ? '已复制' : '复制'}</button>
              </div>
              <div className="text-xs text-gray-500 mt-2">已邀请 {linkInfo.invited_count}/{linkInfo.limit}</div>
            </div>
            <div className="mt-4 text-xs text-gray-500">明细可在 个人中心 → 邀请记录 查看</div>
          </div>
        )}
        {linkInfo?.error && <div className="text-red-600">{linkInfo.error}</div>}
      </div>
    </div>
  )
}


