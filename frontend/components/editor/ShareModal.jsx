'use client'

import { useState } from 'react'
import { X, Link as LinkIcon, Copy } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export default function ShareModal({ isOpen, onClose, mindmapTitle }) {
  const [shareLink, setShareLink] = useState('https://think.so/share/12345') // 示例链接
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">分享 "{mindmapTitle}"</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            任何人都可以通过此链接查看此思维导图。
          </p>
          <div className="flex space-x-2">
            <Input value={shareLink} readOnly />
            <Button onClick={handleCopy} className="w-24">
              {copied ? '已复制' : <><Copy className="w-4 h-4 mr-2" />复制</>}
            </Button>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            完成
          </Button>
        </div>
      </div>
    </div>
  )
}