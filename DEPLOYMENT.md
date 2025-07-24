# ThinkSo 部署指南

## 🚀 Render 部署（推荐）

### 第一步：创建 PostgreSQL 数据库

1. **在 Render Dashboard 创建数据库**
   - 前往 [Render Dashboard](https://dashboard.render.com)
   - 点击 "New +" → "PostgreSQL"
   - Name: `thinktree-database`
   - Database: `thinktree`
   - User: `thinktree_user`
   - Region: 选择最近的区域
   - Plan: Free ($0/month)

2. **获取数据库连接 URL**
   - 创建完成后，复制 "External Database URL"
   - 格式类似：`postgresql://username:password@hostname:port/database`

### 第二步：后端部署 (FastAPI 到 Render)

1. **创建 Web Service**
   - 连接 GitHub 仓库  
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **环境变量配置**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SECRET_KEY=your_secret_key_32_chars_minimum
   DATABASE_URL=postgresql://username:password@hostname:port/database
   DEBUG=false
   ```

### 第三步：前端部署 (Next.js 到 Render)

1. **创建 Static Site**
   - 连接 GitHub 仓库
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `.next` 或 `out`

2. **环境变量配置**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
   ```

### 🔒 数据持久化保证

使用 PostgreSQL 后：
- ✅ 数据库独立于应用容器，重新部署不会丢失数据
- ✅ 用户账号、思维导图等数据永久保存
- ✅ 支持数据备份和恢复
- ✅ 生产环境级别的可靠性

### 🚀 快速部署指南

1. **创建 PostgreSQL 数据库**
   ```bash
   # 在 Render Dashboard 中：
   # New+ → PostgreSQL → 创建数据库
   # 复制 External Database URL
   ```

2. **配置后端环境变量**
   ```bash
   DATABASE_URL=postgresql://username:password@hostname:port/database
   GEMINI_API_KEY=your_gemini_api_key
   SECRET_KEY=your_32_character_secret_key
   ```

3. **部署后端服务**
   ```bash
   # Build Command: pip install -r requirements.txt
   # Start Command: python init_db.py && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. **部署前端服务**
   ```bash
   # Build Command: npm install && npm run build
   # Environment: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

### 📋 数据库迁移管理

项目使用 Alembic 进行数据库版本管理：

```bash
# 初始化数据库
python init_db.py

# 生成新的迁移文件
alembic revision --autogenerate -m "描述变更"

# 运行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 🔧 本地开发部署

### 启动后端
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 启动前端  
```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:3000

## 🏗️ Docker 部署

### docker-compose.yml
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./uploads:/app/uploads
```

## 📋 部署检查清单

### 必须配置项
- [ ] GEMINI_API_KEY: Google Gemini API 密钥
- [ ] SECRET_KEY: 32位以上随机字符串
- [ ] NEXT_PUBLIC_API_URL: 前端指向后端的URL

### 功能验证
- [ ] 主页访问正常 (/)
- [ ] 思维导图生成测试 (/test)
- [ ] Markmap 渲染正常
- [ ] API 响应正常 (/docs)

## 👑 管理员初始化指南

### 概述

ThinkSo 支持邀请码注册系统。要开始使用，您需要先创建管理员账户和邀请码。

### 方法一：使用 Python 脚本（推荐）

1. **准备脚本**
   ```bash
   # 复制模板文件
   cp create_admin.py.template create_admin.py
   ```

2. **设置环境变量**
   ```bash
   export ADMIN_EMAIL="your-admin@example.com"
   export ADMIN_PASSWORD="YourSecurePassword123!"
   export API_BASE_URL="https://thinktree-backend.onrender.com"
   export INVITATION_COUNT="10"  # 可选，默认5个
   ```

3. **运行初始化脚本**
   ```bash
   python create_admin.py
   ```

### 方法二：使用 Shell 脚本

1. **准备脚本**
   ```bash
   # 复制模板文件
   cp init_admin.sh.template init_admin.sh
   chmod +x init_admin.sh
   ```

2. **设置环境变量（可选）**
   ```bash
   export ADMIN_EMAIL="your-admin@example.com"
   export ADMIN_PASSWORD="YourSecurePassword123!"
   export API_BASE_URL="https://thinktree-backend.onrender.com"
   export INVITATION_COUNT="10"
   ```

3. **运行初始化脚本**
   ```bash
   ./init_admin.sh
   ```

### 初始化完成后

脚本会输出：
- 管理员账户信息
- 创建的邀请码列表
- 测试注册链接

### 安全注意事项

⚠️ **重要安全提醒**:
- 模板文件 (`*.template`) 可以安全提交到代码库
- 实际使用的脚本 (`create_admin.py`, `init_admin.sh`) 已被 `.gitignore` 排除
- 请勿将包含真实密码的脚本提交到代码库
- 生产环境中使用强密码和环境变量

### 故障排除

**常见问题**:
- **"ADMIN_INIT 邀请码不存在"**: 需要后端支持特殊管理员邀请码
- **"网络连接失败"**: 检查 API 地址和网络连接
- **"创建失败"**: 检查邮件服务配置和数据库连接

## 🐛 常见问题

**CORS 错误**: 检查前端API_URL配置
**API密钥错误**: 验证GEMINI_API_KEY有效性
**Markmap不显示**: 检查浏览器控制台错误
**管理员初始化失败**: 检查邮件服务配置和数据库连接

---
**技术栈**: Next.js 14 + FastAPI + Markmap + Google Gemini AI