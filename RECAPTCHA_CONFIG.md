# Google reCAPTCHA v3 配置指南

## 📋 概述

ThinkSo已完整集成Google reCAPTCHA v3人机验证系统，用于防止机器人恶意注册和滥用。本文档提供详细的配置步骤。

## 🛠️ 获取reCAPTCHA密钥

### 1. 访问Google reCAPTCHA管理后台
- 网址：https://www.google.com/recaptcha/admin/
- 使用Google账号登录

### 2. 创建新站点
点击"+"号创建新站点，填写以下信息：

**标签**：ThinkSo (或你的项目名)

**reCAPTCHA类型**：选择 **reCAPTCHA v3**

**域名设置**：
- 开发环境：`localhost`
- 生产环境：`thinkso.io` (你的实际域名)

**所有者**：填写你的邮箱地址

### 3. 获取密钥
创建后会得到两个密钥：
- **Site Key（站点密钥）**：公开的，用于前端，通常以`6L`开头
- **Secret Key（私密密钥）**：机密的，用于后端验证

## ⚙️ 配置步骤

### 后端配置

1. **编辑** `/Users/qingche/Documents/Coding/ThinkTree/backend/.env`
2. **取消注释并填写**：
```bash
# Google reCAPTCHA v3 配置 (可选，用于防止机器人注册)
RECAPTCHA_SECRET_KEY=你的_Secret_Key_这里
RECAPTCHA_SCORE_THRESHOLD=0.5
```

### 前端配置

1. **编辑** `/Users/qingche/Documents/Coding/ThinkTree/frontend/.env.local`
2. **取消注释并填写**：
```bash
# Google reCAPTCHA v3 配置 (可选)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=你的_Site_Key_这里
```

### 生产环境配置 (Render)

在Render部署平台的环境变量中添加：

**后端服务**：
- `RECAPTCHA_SECRET_KEY` = 你的Secret Key
- `RECAPTCHA_SCORE_THRESHOLD` = `0.5`

**前端服务**：
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = 你的Site Key

## 🔧 验证配置

### 测试步骤

1. **重启服务**：
```bash
# 后端
cd backend && python main.py

# 前端  
cd frontend && npm run dev
```

2. **打开浏览器控制台**，访问注册页面

3. **查看日志**：
   - 🤖 reCAPTCHA Token获取成功 ← 前端正常
   - 后端应显示reCAPTCHA验证相关日志

### 验证成功标志

**前端**：
- 控制台显示"🤖 reCAPTCHA Token获取成功"
- 注册时请求包含`has_recaptcha: true`

**后端**：
- 启动时显示"reCAPTCHA 已启用"
- 注册时进行人机验证检查

## 📊 分数阈值说明

reCAPTCHA v3返回0.0-1.0的分数：
- **1.0**：很可能是人类用户
- **0.5**：默认阈值（建议值）
- **0.0**：很可能是机器人

可根据需要调整`RECAPTCHA_SCORE_THRESHOLD`值：
- 更严格：`0.7`（可能误拦截真实用户）
- 更宽松：`0.3`（可能放过一些机器人）

## 🚫 禁用reCAPTCHA

如果暂时不需要reCAPTCHA功能：

1. **注释掉环境变量**：
```bash
# RECAPTCHA_SECRET_KEY=...
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

2. **系统会自动禁用**reCAPTCHA功能，不影响正常使用

## 🔍 故障排除

### 常见问题

**1. 前端报错"reCAPTCHA未加载"**
- 检查`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`是否正确配置
- 确保域名在reCAPTCHA后台已添加

**2. 后端验证失败**
- 检查`RECAPTCHA_SECRET_KEY`是否正确
- 确认Site Key和Secret Key匹配

**3. 本地开发访问问题**
- 确保reCAPTCHA后台添加了`localhost`域名
- 检查浏览器是否阻止了reCAPTCHA脚本

### 调试命令

检查环境变量是否生效：
```bash
# 后端
cd backend && python -c "from app.core.config import settings; print(f'reCAPTCHA启用: {bool(settings.recaptcha_secret_key)}')"

# 前端
echo $NEXT_PUBLIC_RECAPTCHA_SITE_KEY
```

## 📝 当前实现状态

✅ **已完成**：
- 后端reCAPTCHA验证逻辑
- 前端GoogleReCaptchaProvider集成  
- 注册流程reCAPTCHA验证
- 环境变量配置模板
- 优雅降级（未配置时自动禁用）

✅ **生产就绪**：只需填写密钥即可启用完整的人机验证功能。

---

**配置完成后，你的ThinkSo应用将具备企业级的机器人防护能力！** 🛡️