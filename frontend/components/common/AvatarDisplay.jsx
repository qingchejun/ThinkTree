/**
 * 头像显示组件
 * 用于在各个页面中显示用户头像
 */
'use client';

import React from 'react';
import { getAvatarConfig } from './AvatarSelector';

function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getPalette(seedInt) {
  const palettes = [
    ['#111827', '#2563eb', '#60a5fa'], // gray-900, blue-600, blue-300
    ['#111827', '#10b981', '#6ee7b7'], // emerald
    ['#111827', '#8b5cf6', '#c4b5fd'], // violet
    ['#111827', '#f97316', '#fdba74'], // orange
    ['#111827', '#f43f5e', '#fda4af'], // rose
    ['#111827', '#06b6d4', '#67e8f9'], // cyan
  ];
  return palettes[seedInt % palettes.length];
}

function GeneratedGeoAvatar({ seed, size, showBorder, className }) {
  const seedInt = hashStringToInt(seed || 'thinkso');
  const [base, accent1, accent2] = getPalette(seedInt);
  const r1 = 20 + (seedInt % 20); // 20 - 39
  const r2 = 10 + ((seedInt >> 3) % 18); // 10 - 27
  const r3 = 6 + ((seedInt >> 6) % 14); // 6 - 19
  const rot = (seedInt % 360);
  return (
    <div
      className={`rounded-full overflow-hidden ${showBorder ? 'ring-1 ring-gray-200' : ''} ${className}`}
      style={{ width: size, height: size, background: '#f9fafb' }}
      aria-label="几何头像"
    >
      <svg width={size} height={size} viewBox="0 0 100 100" role="img">
        <defs>
          <linearGradient id={`g1-${seedInt}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent1} />
            <stop offset="100%" stopColor={accent2} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
        <g transform={`translate(50,50) rotate(${rot})`}>
          <circle cx="0" cy="0" r={r1} fill={`url(#g1-${seedInt})`} opacity="0.9" />
          <rect x={-r2} y={-r2} width={r2 * 2} height={r2 * 2} fill={base} opacity="0.08" />
          <polygon points={`0,-${r3} ${r3},${r3} -${r3},${r3}`} fill={base} opacity="0.12" />
        </g>
      </svg>
    </div>
  );
}

function MonogramAvatar({ letters, size, showBorder, className }) {
  const seedInt = hashStringToInt(letters || 'TT');
  const [, c1, c2] = getPalette(seedInt);
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white ${showBorder ? 'ring-1 ring-gray-200' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
      aria-label="字母头像"
    >
      <span style={{ fontSize: Math.max(12, Math.floor(size * 0.42)) }}>{letters?.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

export default function AvatarDisplay({
  avatarId = 'default',
  size = 40,
  className = '',
  showBorder = true,
}) {
  // 新协议：'geo:<seed>' 或 'mono:<letters>'
  if (typeof avatarId === 'string') {
    if (avatarId.startsWith('geo:')) {
      const seed = avatarId.slice(4);
      return (
        <GeneratedGeoAvatar seed={seed} size={size} showBorder={showBorder} className={className} />
      );
    }
    if (avatarId.startsWith('mono:')) {
      const letters = avatarId.slice(5) || 'TT';
      return (
        <MonogramAvatar letters={letters} size={size} showBorder={showBorder} className={className} />
      );
    }
  }

  // 兼容旧实现
  const avatarConfig = getAvatarConfig(avatarId);
  const IconComponent = avatarConfig.icon;
  return (
    <div
      className={`rounded-full flex items-center justify-center ${showBorder ? 'border-2 border-gray-200' : ''} ${className}`}
      style={{ backgroundColor: avatarConfig.bgColor, width: size, height: size }}
    >
      <IconComponent size={size * 0.5} color={avatarConfig.color} strokeWidth={1.5} />
    </div>
  );
}