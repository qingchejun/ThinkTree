/**
 * ThinkTree 设计系统 - 语义化色彩工具
 * 提供统一的样式类名和工具函数，简化组件开发
 */

// ===== 语义化文本色彩 =====
export const textColors = {
  // 主要文本层次
  primary: 'text-brand-800',      // 主标题、重要文本 - 深灰色
  secondary: 'text-brand-600',    // 副标题、正文 - 中灰色  
  tertiary: 'text-brand-500',     // 辅助文本、描述 - 浅灰色
  quaternary: 'text-brand-400',   // 占位符、禁用文本 - 更浅灰色
  inverse: 'text-neutral-white',  // 反色文本 - 白色
  
  // 状态文本色彩
  success: 'text-success-600',    // 成功状态 - 绿色
  warning: 'text-warning-600',    // 警告状态 - 黄色
  error: 'text-error-600',        // 错误状态 - 红色
  info: 'text-info-600',          // 信息状态 - 蓝色
  
  // 功能文本色彩
  core: 'text-core-600',          // 核心功能 - 蓝色
  content: 'text-content-600',    // 内容处理 - 绿色
  collaboration: 'text-collaboration-600', // 协作功能 - 紫色
  accent: 'text-accent-700',      // 强调文本 - 橙色
}

// ===== 语义化背景色彩 =====
export const backgroundColors = {
  // 主要背景层次
  primary: 'bg-neutral-white',    // 主背景 - 纯白色
  secondary: 'bg-brand-50',       // 次要背景 - 浅灰色
  tertiary: 'bg-brand-100',       // 第三级背景 - 更浅灰色
  overlay: 'bg-brand-900/50',     // 遮罩背景 - 半透明深灰
  
  // 状态背景色彩
  success: 'bg-success-50',       // 成功背景 - 浅绿色
  warning: 'bg-warning-50',       // 警告背景 - 浅黄色
  error: 'bg-error-50',           // 错误背景 - 浅红色
  info: 'bg-info-50',             // 信息背景 - 浅蓝色
  
  // 功能背景色彩
  core: 'bg-core-100',            // 核心功能背景 - 浅蓝色
  content: 'bg-content-100',      // 内容处理背景 - 浅绿色
  collaboration: 'bg-collaboration-100', // 协作功能背景 - 浅紫色
  accent: 'bg-accent-100',        // 强调背景 - 浅橙色
  
  // 品牌背景色彩
  brand: {
    primary: 'bg-brand-800',      // 主品牌背景 - 深灰色
    secondary: 'bg-brand-900',    // 深品牌背景 - 更深灰色
    dark: 'bg-brand-950',         // 最深背景 - 纯黑色
  }
}

// ===== 语义化边框色彩 =====
export const borderColors = {
  // 主要边框层次
  primary: 'border-brand-200',    // 主边框 - 浅灰色
  secondary: 'border-brand-100',  // 次要边框 - 更浅灰色
  tertiary: 'border-brand-50',    // 第三级边框 - 很浅灰色
  
  // 交互状态边框
  focus: 'border-brand-500',      // 焦点边框 - 中灰色
  hover: 'border-brand-300',      // 悬停边框 - 浅灰色
  
  // 状态边框色彩
  success: 'border-success-200',  // 成功边框 - 浅绿色
  warning: 'border-warning-200',  // 警告边框 - 浅黄色
  error: 'border-error-200',      // 错误边框 - 浅红色
  info: 'border-info-200',        // 信息边框 - 浅蓝色
  
  // 功能边框色彩
  core: 'border-core-200',        // 核心功能边框 - 浅蓝色
  content: 'border-content-200',  // 内容处理边框 - 浅绿色
  collaboration: 'border-collaboration-200', // 协作功能边框 - 浅紫色
  accent: 'border-accent-200',    // 强调边框 - 浅橙色
}

// ===== 组件样式模式 =====
export const componentPatterns = {
  // 按钮样式模式
  button: {
    primary: [
      'bg-brand-800 text-neutral-white',
      'hover:bg-brand-900 active:bg-brand-950',
      'focus:ring-2 focus:ring-brand-500/20',
      'transition-colors duration-200'
    ].join(' '),
    
    secondary: [
      'bg-brand-100 text-brand-800',
      'hover:bg-brand-200 active:bg-brand-300',
      'focus:ring-2 focus:ring-brand-500/20',
      'transition-colors duration-200'
    ].join(' '),
    
    accent: [
      'bg-accent-600 text-neutral-white',
      'hover:bg-accent-700 active:bg-accent-800',
      'focus:ring-2 focus:ring-accent-500/20',
      'transition-colors duration-200'
    ].join(' '),
    
    ghost: [
      'text-brand-700 bg-transparent',
      'hover:bg-brand-100 active:bg-brand-200',
      'focus:ring-2 focus:ring-brand-500/20',
      'transition-colors duration-200'
    ].join(' '),

    // 功能按钮（与方案对齐）
    feature: [
      'bg-core-600 text-neutral-white',
      'hover:bg-core-700 active:bg-core-800',
      'focus:ring-2 focus:ring-core-500/20',
      'transition-colors duration-200'
    ].join(' '),

    collaborate: [
      'bg-collaboration-600 text-neutral-white',
      'hover:bg-collaboration-700 active:bg-collaboration-800',
      'focus:ring-2 focus:ring-collaboration-500/20',
      'transition-colors duration-200'
    ].join(' ')
  },
  
  // 卡片样式模式
  card: {
    default: [
      'bg-neutral-white border border-brand-200',
      'rounded-lg shadow-sm',
      'transition-shadow duration-200'
    ].join(' '),
    
    elevated: [
      'bg-neutral-white border border-brand-200',
      'rounded-lg shadow-md',
      'transition-shadow duration-200'
    ].join(' '),
    
    interactive: [
      'bg-neutral-white border border-brand-200',
      'rounded-lg shadow-sm hover:shadow-md',
      'cursor-pointer transition-all duration-200',
      'hover:border-brand-300'
    ].join(' '),

    // 与方案对齐的变体
    borderless: [
      'bg-neutral-white border-0 rounded-lg shadow-lg'
    ].join(' '),

    feature: [
      'bg-brand-50 border-0 rounded-2xl shadow-sm'
    ].join(' '),

    highlight: [
      'bg-accent-50 border border-accent-200 rounded-lg shadow-sm'
    ].join(' ')
  },
  
  // 输入框样式模式
  input: {
    default: [
      'bg-neutral-white border border-brand-200',
      'rounded-md px-3 py-2 text-sm',
      'placeholder:text-brand-400',
      'focus:outline-none focus:ring-2 focus:ring-brand-500/20',
      'focus:border-brand-500',
      'transition-colors duration-200'
    ].join(' '),
    
    error: [
      'bg-neutral-white border border-error-500',
      'rounded-md px-3 py-2 text-sm',
      'placeholder:text-brand-400',
      'focus:outline-none focus:ring-2 focus:ring-error-500/20',
      'focus:border-error-600',
      'transition-colors duration-200'
    ].join(' ')
  },
  
  // 折叠按钮样式模式 (统一creation组件使用)
  collapseButton: [
    'w-full flex items-center justify-between text-left',
    'text-sm font-semibold text-brand-800 mb-2',
    'hover:text-brand-900 transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 rounded-md p-1'
  ].join(' '),
  
  // 状态提示样式模式
  statusText: {
    success: 'text-xs text-success-600 bg-success-50 px-2 py-1 rounded',
    warning: 'text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded',
    error: 'text-xs text-error-600 bg-error-50 px-2 py-1 rounded',
    info: 'text-xs text-info-600 bg-info-50 px-2 py-1 rounded',
  }
}

// ===== 功能卡片样式工具 =====
export const featureCardStyles = {
  // 核心AI功能卡片
  core: {
    container: `${backgroundColors.core} p-8 rounded-2xl flex items-start space-x-6`,
    iconWrapper: 'flex-shrink-0 flex items-center justify-center w-12 h-12 bg-core-100 rounded-xl',
    icon: textColors.core,
    title: 'text-xl font-semibold text-brand-900 mb-2',
    description: textColors.secondary
  },
  
  // 内容处理功能卡片
  content: {
    container: `${backgroundColors.content} p-8 rounded-2xl flex items-start space-x-6`,
    iconWrapper: 'flex-shrink-0 flex items-center justify-center w-12 h-12 bg-content-100 rounded-xl',
    icon: textColors.content,
    title: 'text-xl font-semibold text-brand-900 mb-2',
    description: textColors.secondary
  },
  
  // 协作扩展功能卡片
  collaboration: {
    container: `${backgroundColors.collaboration} p-8 rounded-2xl flex items-start space-x-6`,
    iconWrapper: 'flex-shrink-0 flex items-center justify-center w-12 h-12 bg-collaboration-100 rounded-xl',
    icon: textColors.collaboration,
    title: 'text-xl font-semibold text-brand-900 mb-2',
    description: textColors.secondary
  }
}

// ===== 工具函数 =====

// 图标尺寸语义映射（统一 Lucide 图标尺寸）
export const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  default: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
  '2xl': 'h-12 w-12'
}

/**
 * 根据功能类型获取对应的色彩类名
 * @param {string} type - 功能类型 ('core' | 'content' | 'collaboration')
 * @param {string} element - 元素类型 ('background' | 'text' | 'border')
 * @param {string} shade - 色彩深度 (50, 100, 200, 500, 600, 700)
 * @returns {string} Tailwind CSS 类名
 */
export function getFeatureColor(type, element = 'background', shade = '100') {
  const colorMap = {
    core: 'core',
    content: 'content', 
    collaboration: 'collaboration'
  }
  
  const elementPrefix = {
    background: 'bg',
    text: 'text',
    border: 'border'
  }
  
  const colorType = colorMap[type] || 'core'
  const prefix = elementPrefix[element] || 'bg'
  
  return `${prefix}-${colorType}-${shade}`
}

/**
 * 根据状态获取对应的色彩类名
 * @param {string} status - 状态类型 ('success' | 'warning' | 'error' | 'info')
 * @param {string} element - 元素类型 ('background' | 'text' | 'border')
 * @param {string} shade - 色彩深度
 * @returns {string} Tailwind CSS 类名
 */
export function getStatusColor(status, element = 'text', shade = '600') {
  const elementPrefix = {
    background: 'bg',
    text: 'text',
    border: 'border'
  }
  
  const prefix = elementPrefix[element] || 'text'
  return `${prefix}-${status}-${shade}`
}

/**
 * 生成组件的完整样式类名
 * @param {string} pattern - 样式模式名称
 * @param {string} variant - 变体名称
 * @param {string} additionalClasses - 额外的CSS类名
 * @returns {string} 完整的CSS类名字符串
 */
export function getComponentStyles(pattern, variant = 'default', additionalClasses = '') {
  const patternStyles = componentPatterns[pattern]?.[variant] || ''
  return `${patternStyles} ${additionalClasses}`.trim()
}

// ===== 导出所有工具 =====
export default {
  textColors,
  backgroundColors,
  borderColors,
  componentPatterns,
  featureCardStyles,
  iconSizes,
  getFeatureColor,
  getStatusColor,
  getComponentStyles
}
