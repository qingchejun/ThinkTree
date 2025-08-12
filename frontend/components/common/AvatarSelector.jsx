/**
 * 头像选择器组件
 * 提供用户头像选择功能，支持本地存储用户选择
 * 使用 lucide-react 图标替代 PNG 图片，提升加载速度
 */
'use client';

import { useState, useEffect } from 'react';
import { CircleUser, CircleUserRound, User, UserRound } from 'lucide-react';

const AVATAR_OPTIONS = [
  // 流体头像（默认）
  {
    id: 'blob:default',
    icon: CircleUserRound,
    name: '流体头像（默认）',
    color: '#0ea5e9',
    bgColor: '#ecfeff'
  },
  // 渐变字母
  {
    id: 'mono:TT',
    icon: UserRound,
    name: '字母头像',
    color: '#111827',
    bgColor: '#e5e7eb'
  },
];

export default function AvatarSelector({ isOpen, onClose, onSelect, currentAvatar, user }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'blob:default');

  useEffect(() => {
    setSelectedAvatar(currentAvatar || 'blob:default');
  }, [currentAvatar, isOpen]);

  const handleSelect = (avatarId) => {
    setSelectedAvatar(avatarId);
  };

  const handleConfirm = () => {
    let finalId = selectedAvatar;
    // 对于流体头像，使用同样的稳定种子
    if (selectedAvatar.startsWith('blob:')) {
      const seed = (user?.id || user?.email || 'thinkso').toString();
      finalId = `blob:${seed}`;
    }
    // 对于字母头像，优先显示名缩写/邮箱前缀
    if (selectedAvatar.startsWith('mono:')) {
      const base = (user?.display_name || user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'TT')).toString();
      const letters = base.trim().slice(0, 2).toUpperCase() || 'TT';
      finalId = `mono:${letters}`;
    }
    const selectedOption = AVATAR_OPTIONS.find(option => option.id === selectedAvatar) || { id: finalId };
    onSelect({ ...selectedOption, id: finalId });
    onClose();
  };

  const handleCancel = () => {
    setSelectedAvatar(currentAvatar || 'blob:default');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">选择头像</h3>
          <p className="text-gray-600 text-sm">选择一个你喜欢的头像</p>
        </div>

        {/* 头像网格（第一行：方案A/B） */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {AVATAR_OPTIONS.map((avatar) => {
            const IconComponent = avatar.icon;
            return (
              <div key={avatar.id} className="text-center">
                <button
                  onClick={() => handleSelect(avatar.id)}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-200 ${
                    selectedAvatar === avatar.id
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                  }`}
                  style={{ backgroundColor: avatar.bgColor }}
                >
                  <IconComponent size={40} color={avatar.color} strokeWidth={1.5} />
                  {selectedAvatar === avatar.id && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2 truncate">{avatar.name}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mb-4">提示：默认选择“流体头像”，将基于你的账户信息自动生成稳定的图形；字母头像将使用你的姓名或邮箱前缀生成。</p>

        {/* 操作按钮 */}
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}

// 工具函数：获取用户当前头像
export function getCurrentAvatar() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userAvatar') || 'blob:default';
  }
  return 'blob:default';
}

// 工具函数：根据头像ID获取头像配置
export function getAvatarConfig(avatarId) {
  const avatar = AVATAR_OPTIONS.find(option => option.id === avatarId);
  return avatar || AVATAR_OPTIONS[0]; // 默认返回第一个头像
}

// 兼容性函数：保持原有的getAvatarUrl函数名，但返回头像配置
export function getAvatarUrl(avatarId) {
  return getAvatarConfig(avatarId);
}