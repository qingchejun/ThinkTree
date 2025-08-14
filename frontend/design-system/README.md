# ThinkTree 设计系统

基于 LandingPage 现有色彩系统优化的设计系统，采用渐进式改进策略。

## 🎨 色彩系统

### 主品牌色系 (Brand Colors)

基于现有深灰/黑色系，已形成品牌识别度：

```javascript
// 使用方式
className = "bg-brand-800 text-neutral-white"; // 主要按钮
className = "text-brand-600"; // 主要文本
className = "border-brand-200"; // 边框
```

### 功能色彩分组

将原有 6 种功能色彩简化为 3 种，按功能类型分组：

#### 核心 AI 功能 - 蓝色系

- **智能生成** (原 blue-100/600)
- **AI 智能优化** (原 rose-100/600 → 改为 blue)

```javascript
className = "bg-core-100 text-core-600";
```

#### 内容处理功能 - 绿色系

- **多格式导入** (原 sky-100/600 → 改为 green)
- **多格式导出** (原 purple-100/600 → 改为 green)

```javascript
className = "bg-content-100 text-content-600";
```

#### 协作扩展功能 - 紫色系

- **协作分享** (原 green-100/600 → 改为 purple)
- **无限扩展** (原 amber-100/600 → 改为 purple)

```javascript
className = "bg-collaboration-100 text-collaboration-600";
```

## 🛠️ 使用指南

### 1. 导入设计系统

```javascript
import {
  textColors,
  backgroundColors,
  componentPatterns,
} from "@/design-system/tokens/semantic";
```

### 2. 使用语义化色彩

```javascript
// 文本色彩
className={textColors.primary}     // 主要文本
className={textColors.secondary}   // 次要文本
className={textColors.error}       // 错误文本

// 背景色彩
className={backgroundColors.primary}   // 主背景
className={backgroundColors.core}      // 核心功能背景
```

### 3. 使用组件样式模式

```javascript
// 折叠按钮统一样式
className={componentPatterns.collapseButton}

// 按钮样式
className={componentPatterns.button.primary}
className={componentPatterns.button.secondary}
```

### 4. 使用工具函数

```javascript
import {
  getFeatureColor,
  getStatusColor,
} from "@/design-system/tokens/semantic";

// 根据功能类型获取色彩
const bgClass = getFeatureColor("core", "background", "100");
const textClass = getFeatureColor("core", "text", "600");

// 根据状态获取色彩
const errorText = getStatusColor("error", "text", "600");
```

## 📋 迁移指南

### 从旧色彩系统迁移

#### 替换硬编码色彩

```javascript
// 旧方式 ❌
className="text-gray-800"
className="bg-blue-100 text-blue-600"
className="text-red-500"

// 新方式 ✅
className={textColors.primary}
className={`${backgroundColors.core} ${textColors.core}`}
className={textColors.error}
```

#### 功能卡片色彩迁移

```javascript
// 旧方式 ❌
<div className="bg-blue-100 p-8 rounded-2xl">
  <div className="bg-blue-100 rounded-xl">
    <Cpu className="text-blue-600" />
  </div>
</div>

// 新方式 ✅
<div className={featureCardStyles.core.container}>
  <div className={featureCardStyles.core.iconWrapper}>
    <Cpu className={featureCardStyles.core.icon} />
  </div>
</div>
```

## 🎯 设计原则

1. **语义化优先**: 使用语义化的色彩命名，而非具体色值
2. **功能分组**: 按功能类型使用统一的色彩系统
3. **渐进式迁移**: 保持向后兼容，逐步迁移到新系统
4. **一致性**: 统一的交互状态和视觉层次

## 🔄 向后兼容

设计系统保持向后兼容，原有色彩类名仍然可用：

```javascript
// 这些仍然有效
className = "text-gray-800"; // 映射到 brand-800
className = "bg-blue-100"; // 映射到 core-100
className = "text-green-600"; // 映射到 content-600
```

## 📈 未来规划

1. **暗色主题支持**: 基于当前色彩系统扩展暗色变体
2. **动画系统**: 统一的过渡动画和交互效果
3. **间距系统**: 标准化的间距和布局规范
4. **组件库扩展**: 更多预定义的组件样式模式

---

**版本**: v1.0.0  
**基于**: LandingPage 现有色彩系统  
**策略**: 渐进式改进 + 向后兼容
