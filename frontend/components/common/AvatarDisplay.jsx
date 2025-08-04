/**
 * 头像显示组件
 * 用于在各个页面中显示用户头像
 */
'use client';

import { getAvatarConfig } from './AvatarSelector';

export default function AvatarDisplay({ 
  avatarId = 'default', 
  size = 40, 
  className = '',
  showBorder = true 
}) {
  const avatarConfig = getAvatarConfig(avatarId);
  const IconComponent = avatarConfig.icon;

  return (
    <div 
      className={`rounded-full flex items-center justify-center ${
        showBorder ? 'border-2 border-gray-200' : ''
      } ${className}`}
      style={{ 
        backgroundColor: avatarConfig.bgColor,
        width: size,
        height: size
      }}
    >
      <IconComponent 
        size={size * 0.5} 
        color={avatarConfig.color}
        strokeWidth={1.5}
      />
    </div>
  );
}