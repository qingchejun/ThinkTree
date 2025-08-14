/**
 * ThinkTree 设计系统 - 色彩Token
 * 基于 LandingPage 现有色彩系统优化，采用渐进式改进策略
 */

// ===== 主品牌色系 =====
// 保持现有深灰/黑色系，已形成品牌识别度
export const brandColors = {
  // 基于现有 gray 系列，重新命名为品牌色
  50: '#f9fafb',   // 浅灰背景 (原gray-50)
  100: '#f3f4f6',  // 卡片背景 (原gray-100) 
  200: '#e5e7eb',  // 边框色 (原gray-200)
  300: '#d1d5db',  // 分割线 (原gray-300)
  400: '#9ca3af',  // 占位符 (原gray-400)
  500: '#6b7280',  // 次要文字 (原gray-500)
  600: '#4b5563',  // 主要文字 (原gray-600)
  700: '#374151',  // 深色文字 (原gray-700)
  800: '#1f2937',  // 主品牌色 (原gray-800) - 主要CTA按钮
  900: '#111827',  // 深品牌色 (原gray-900) - 底部CTA区域
  950: '#000000',  // 纯黑色 (原black) - 页脚背景
}

// ===== 强调色系 =====
// 基于现有橙色系，用于重要提示和福利信息
export const accentColors = {
  50: '#fff7ed',   // 浅橙背景 (原orange-50) - 福利横幅渐变起点
  100: '#fed7aa',  // 橙色背景 (原orange-100) - NEW徽章背景
  200: '#fed7aa',  // 橙色边框 (原orange-200) - NEW徽章边框
  500: '#f97316',  // 主强调色 - 新增，用于hover状态
  600: '#ea580c',  // 强调色 - 新增，用于按钮等
  700: '#c2410c',  // 深橙色 (原orange-700) - NEW徽章文字
  800: '#9a3412',  // 更深橙色 (原orange-800) - 福利横幅文字
}

// ===== 功能色系 - 简化为3组 =====
// 将原有6种功能色彩简化为3种，按功能类型分组

// 核心AI功能 - 蓝色系 (智能生成、AI智能优化)
export const coreColors = {
  50: '#eff6ff',   // 浅蓝背景
  100: '#dbeafe',  // 蓝色背景 (原blue-100) - 保持不变
  200: '#bfdbfe',  // 浅蓝边框
  500: '#3b82f6',  // 主蓝色
  600: '#2563eb',  // 蓝色文字 (原blue-600) - 保持不变
  700: '#1d4ed8',  // 深蓝色
}

// 内容处理功能 - 绿色系 (多格式导入、多格式导出)
export const contentColors = {
  50: '#f0fdf4',   // 浅绿背景
  100: '#dcfce7',  // 绿色背景 (原green-100) - 保持不变
  200: '#bbf7d0',  // 浅绿边框
  500: '#22c55e',  // 主绿色
  600: '#16a34a',  // 绿色文字 (原green-600) - 保持不变
  700: '#15803d',  // 深绿色
}

// 协作扩展功能 - 紫色系 (协作分享、无限扩展)
export const collaborationColors = {
  50: '#faf5ff',   // 浅紫背景
  100: '#f3e8ff',  // 紫色背景 (原purple-100) - 保持不变
  200: '#e9d5ff',  // 浅紫边框
  500: '#a855f7',  // 主紫色
  600: '#9333ea',  // 紫色文字 (原purple-600) - 保持不变
  700: '#7c3aed',  // 深紫色
}

// ===== 状态色系 =====
// 用于错误、成功、警告等状态提示
export const statusColors = {
  // 错误状态 - 基于现有红色系
  error: {
    50: '#fef2f2',   // 浅红背景 (原red-50) - 错误提示背景
    100: '#fee2e2',  // 红色背景
    200: '#fecaca',  // 红色边框 (原red-200) - 错误提示边框
    500: '#ef4444',  // 主错误色 (原red-500) - 错误文字
    600: '#dc2626',  // 深错误色
    700: '#b91c1c',  // 更深错误色 (原red-700) - 错误提示文字
    800: '#991b1b',  // 最深错误色 (原red-800) - 错误标题文字
  },
  
  // 成功状态 - 复用绿色系
  success: {
    50: '#f0fdf4',   // 浅绿背景
    100: '#dcfce7',  // 绿色背景
    500: '#22c55e',  // 主成功色
    600: '#16a34a',  // 成功文字色
    700: '#15803d',  // 深成功色
  },
  
  // 警告状态 - 基于黄色系
  warning: {
    50: '#fefce8',   // 浅黄背景 (原yellow-50) - 福利横幅渐变终点
    100: '#fef3c7',  // 黄色背景
    500: '#eab308',  // 主警告色
    600: '#ca8a04',  // 警告文字色
    700: '#a16207',  // 深警告色
  },
  
  // 信息状态 - 基于蓝色系
  info: {
    50: '#eff6ff',   // 浅蓝背景
    100: '#dbeafe',  // 蓝色背景
    500: '#3b82f6',  // 主信息色
    600: '#2563eb',  // 信息文字色
    700: '#1d4ed8',  // 深信息色
  }
}

// ===== 中性色系 =====
// 用于背景、文字、边框等基础元素
export const neutralColors = {
  white: '#ffffff',    // 纯白色 - 卡片背景、按钮文字
  black: '#000000',    // 纯黑色 - 页脚背景
  transparent: 'transparent', // 透明色
}

// ===== 导出统一色彩系统 =====
export const colors = {
  // 主要色彩系统
  brand: brandColors,
  accent: accentColors,
  
  // 功能色彩系统
  core: coreColors,
  content: contentColors,
  collaboration: collaborationColors,
  
  // 状态色彩系统
  status: statusColors,
  
  // 基础色彩
  neutral: neutralColors,
  
  // 向后兼容 - 保留原有命名，逐步迁移
  gray: brandColors,  // gray -> brand 的别名
  orange: accentColors, // orange -> accent 的别名
  blue: coreColors,   // blue -> core 的别名
  green: contentColors, // green -> content 的别名
  purple: collaborationColors, // purple -> collaboration 的别名
  red: statusColors.error, // red -> status.error 的别名
}

// ===== 功能卡片色彩映射 =====
// 定义LandingPage功能卡片的新色彩分组
export const featureCardColors = {
  // 核心AI功能组 - 蓝色系
  core: {
    background: 'bg-core-100',    // 浅蓝背景
    icon: 'text-core-600',        // 蓝色图标
    features: ['智能生成', 'AI智能优化']
  },
  
  // 内容处理功能组 - 绿色系  
  content: {
    background: 'bg-content-100', // 浅绿背景
    icon: 'text-content-600',     // 绿色图标
    features: ['多格式导入', '多格式导出']
  },
  
  // 协作扩展功能组 - 紫色系
  collaboration: {
    background: 'bg-collaboration-100', // 浅紫背景
    icon: 'text-collaboration-600',     // 紫色图标
    features: ['协作分享', '无限扩展']
  }
}

export default colors
