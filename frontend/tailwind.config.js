/** @type {import('tailwindcss').Config} */
const { colors } = require('./design-system/tokens/colors.js')

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ===== 新设计系统色彩 =====
        // 主品牌色系
        brand: colors.brand,
        
        // 强调色系  
        accent: colors.accent,
        
        // 功能色系
        core: colors.core,
        content: colors.content,
        collaboration: colors.collaboration,
        
        // 状态色系
        success: colors.status.success,
        warning: colors.status.warning,
        error: colors.status.error,
        info: colors.status.info,
        
        // 基础色系
        neutral: colors.neutral,
        
        // ===== 向后兼容 - 保留原有色彩系统 =====
        // 逐步迁移，避免破坏现有组件
        
        // 保留原有品牌色彩系统 (逐步迁移到brand)
        text: {
          primary: colors.brand[800],    // 主文字色 - 深灰色
          secondary: colors.brand[500],  // 辅助文字色
          tertiary: colors.brand[400]    // 第三级文字色
        },
        border: {
          primary: colors.brand[200],    // 主要边框色
          secondary: colors.brand[100]   // 次要边框色
        },
        background: {
          primary: colors.neutral.white,    // 主背景色
          secondary: colors.brand[50]       // 次要背景色
        },
        
        // 保留原有ThinkSo品牌色彩 (逐步废弃)
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',  // 主色调
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        
        // 保留原有状态色彩 (逐步迁移到新的status系统)
        // success: 已在上面定义为新系统
        // warning: 已在上面定义为新系统  
        // error: 已在上面定义为新系统
        
        // 保留原有灰色系统 (映射到brand色系)
        gray: colors.brand,
        
        // 保留原有功能色彩 (逐步迁移)
        orange: colors.accent,  // 橙色 -> 强调色
        blue: colors.core,      // 蓝色 -> 核心功能色
        green: colors.content,  // 绿色 -> 内容处理色
        purple: colors.collaboration, // 紫色 -> 协作功能色
        red: colors.status.error,     // 红色 -> 错误状态色
        
        // 保留其他原有色彩系统
        sky: {
          100: colors.content[100], // 映射到内容处理色
          600: colors.content[600],
        },
        rose: {
          100: colors.core[100],    // 映射到核心功能色
          600: colors.core[600],
        },
        amber: {
          100: colors.collaboration[100], // 映射到协作功能色
          600: colors.collaboration[600],
        },
      },
      
      fontFamily: {
        // 更新字体系统，以 Inter 为首选
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'strong': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
      },
      
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}