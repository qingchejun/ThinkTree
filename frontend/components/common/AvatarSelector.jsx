/**
 * 头像选择器组件
 * 提供用户头像选择功能，支持本地存储用户选择
 */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const AVATAR_OPTIONS = [
  { id: 'default', src: '/default-avatar.png', name: '默认头像' },
  { id: 'female2', src: '/avatar-female2.png', name: '女性头像 1' },
  { id: 'male1', src: '/avatar-male1.png', name: '男性头像 1' },
  { id: 'male2', src: '/avatar-male2.png', name: '男性头像 2' },
  { id: 'male3', src: '/avatar-male3.png', name: '男性头像 3' }
];

export default function AvatarSelector({ isOpen, onClose, onSelect, currentAvatar }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'default');

  useEffect(() => {
    setSelectedAvatar(currentAvatar || 'default');
  }, [currentAvatar, isOpen]);

  const handleSelect = (avatarId) => {
    setSelectedAvatar(avatarId);
  };

  const handleConfirm = () => {
    const selectedOption = AVATAR_OPTIONS.find(option => option.id === selectedAvatar);
    if (selectedOption) {
      // 保存到本地存储
      localStorage.setItem('userAvatar', selectedAvatar);
      onSelect(selectedOption);
    }
    onClose();
  };

  const handleCancel = () => {
    setSelectedAvatar(currentAvatar || 'default');
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

        {/* 头像网格 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {AVATAR_OPTIONS.map((avatar) => (
            <div key={avatar.id} className="text-center">
              <button
                onClick={() => handleSelect(avatar.id)}
                className={`relative w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-200 ${
                  selectedAvatar === avatar.id
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                }`}
              >
                <Image
                  src={avatar.src}
                  alt={avatar.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
                {selectedAvatar === avatar.id && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
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
          ))}
        </div>

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
    return localStorage.getItem('userAvatar') || 'default';
  }
  return 'default';
}

// 工具函数：根据头像ID获取头像URL
export function getAvatarUrl(avatarId) {
  const avatar = AVATAR_OPTIONS.find(option => option.id === avatarId);
  return avatar ? avatar.src : '/default-avatar.png';
}