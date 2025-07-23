# 🌳 ThinkTree - AI 驱动的思维导图生成工具

将文档内容转换为专业思维导图，基于 Google Gemini AI 和 Markmap 可视化技术。

**当前版本**: v2.2.0 🎉 数据持久化功能完成

## 🌐 在线体验

- **🖥️ 前端应用**: https://thinktree-frontend.onrender.com
- **👤 用户注册**: https://thinktree-frontend.onrender.com/register  
- **🔐 用户登录**: https://thinktree-frontend.onrender.com/login
- **🔧 API 服务**: https://thinktree-backend.onrender.com
- **📚 API 文档**: https://thinktree-backend.onrender.com/docs
- **💚 健康检查**: https://thinktree-backend.onrender.com/health

## ✨ 功能特性

- 🤖 **AI 智能解析**: 基于 Google Gemini API 智能提取文档关键信息
- 📁 **多格式上传**: 支持 PDF、DOCX、TXT、MD、SRT 等多种文档格式
- 🎯 **拖拽上传**: 现代化的文件上传体验，支持拖拽和点击选择
- 🗺️ **Markmap 渲染**: 使用 markmap-lib 和 markmap-view 生成专业思维导图
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🔄 **自适应布局**: 思维导图自动适应窗口大小，支持缩放和拖拽
- ⚡ **实时生成**: 输入文本即时生成思维导图
- 🎨 **现代 UI**: 基于 Tailwind CSS 的美观界面
- ☁️ **云端部署**: Render 平台稳定运行，随时随地访问
- 👤 **用户认证**: 完整的注册/登录系统，JWT 令牌认证 (v2.0.0 ✅)
- 💾 **数据持久化**: PostgreSQL 云端数据库，用户数据安全存储 (v2.0.0 ✅)
- 🔒 **安全加密**: bcrypt 密码加密，JWT 安全令牌管理 (v2.0.0 ✅)
- 🌐 **全局状态**: React Context 用户状态管理，跨页面状态同步 (v2.1.0 ✅)
- 💾 **思维导图保存**: 一键保存生成的思维导图到个人账户 (v2.2.0 ✅)
- 🔄 **自动登录**: 注册成功后无缝自动登录体验 (v2.2.0 ✅)
- 🗄️ **数据不丢失**: PostgreSQL + Alembic 迁移，重新部署数据永久保存 (v2.2.0 ✅)

## 🛠️ 技术栈

**前端**

- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- markmap-view + markmap-lib
- D3.js
- React Context (用户状态管理)

**后端**

- FastAPI (Python 3.11)
- PostgreSQL (云端数据库)
- SQLAlchemy ORM
- JWT + bcrypt (认证加密)
- Google Gemini AI API
- PyMuPDF + pdfplumber + python-docx
- 异步文件处理

**部署**

- Render Cloud Platform (Singapore)
- PostgreSQL 数据库服务
- 前后端分离部署
- 环境变量配置管理

## 🎉 v2.2.0 重大更新

### 💾 数据持久化功能 (全新功能)

ThinkTree v2.2.0 实现了完整的数据持久化系统，用户可以保存和管理自己的思维导图：

**✅ 核心功能**
- **思维导图保存**: 一键保存生成的思维导图到个人账户
- **数据持久化**: PostgreSQL + Alembic 迁移，重新部署数据不丢失
- **全局状态管理**: React Context 实现跨页面用户状态同步
- **自动登录**: 注册成功后无缝自动登录，优化用户体验

**🗄️ 数据库架构**
- **Mindmap 模型**: UUID 主键，用户关联，支持标题/描述/标签
- **CRUD API**: 完整的增删改查接口，JWT 认证保护
- **数据安全**: 用户只能访问自己的思维导图数据
- **迁移工具**: Alembic 数据库版本管理，支持结构变更

**🌐 用户体验升级**
- **状态显示**: 首页和思维导图页面统一显示登录状态
- **保存流程**: 登录用户可直接保存，未登录用户显示登录提示
- **自动跳转**: 登录成功后跳转到首页，注册后自动登录
- **数据安全**: 所有用户数据永久保存，不会因重新部署丢失

**🚀 立即体验**
1. 访问 [注册页面](https://thinktree-frontend.onrender.com/register) 创建账户
2. 生成思维导图后点击"💾 保存"按钮
3. 享受永久保存的个人化思维导图体验

## 🏗️ 项目架构

### v2.2.0 云端架构

```
用户注册/登录 → 全局状态管理 → 思维导图生成/保存
     ↓
     → https://thinktree-frontend.onrender.com (前端 + React Context)
     ↓
     → https://thinktree-backend.onrender.com (后端 + JWT认证)
     ↓
     → PostgreSQL 数据库 (用户 + 思维导图数据)
     ↓
     → Google Gemini AI API (AI 处理)
     ↓
     → Markdown 数据 → markmap 渲染 → 一键保存
```

### 数据流

```
用户输入/文件上传 → FastAPI后端 → 文件解析器 → Gemini AI处理 →
Markdown结构数据 → markmap-lib转换 → markmap-view渲染思维导图
```

### 目录结构

```
ThinkTree/
├── frontend/                 # Next.js 前端应用
│   ├── app/                 # App Router 页面
│   │   ├── page.jsx        # 主页
│   │   ├── test/page.jsx   # 思维导图测试页
│   │   └── ...
│   ├── components/          # React 组件
│   │   ├── mindmap/        # 思维导图组件
│   │   ├── upload/         # 文件上传组件
│   │   └── common/         # 通用组件
│   └── lib/                # 工具库和 API 封装
├── backend/                 # FastAPI 后端应用
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心业务逻辑
│   │   └── models/         # 数据模型
│   ├── main.py             # 应用入口
│   └── requirements.txt    # Python 依赖
└── docs/                    # 项目文档
```

## 🚀 快速开始

### 在线使用 (推荐)

1. **访问应用**: https://thinktree-frontend.onrender.com
2. **选择模式**: 文件上传 或 直接输入文本
3. **上传文档**: 支持 PDF、DOCX、TXT、MD、SRT 格式
4. **生成思维导图**: AI 自动解析并生成专业思维导图
5. **交互探索**: 缩放、拖拽、平移思维导图

### 本地开发

#### 环境要求

- Node.js 18+
- Python 3.11+
- Google Gemini API Key

#### 克隆项目

```bash
git clone https://github.com/qingchejun/ThinkTree.git
cd ThinkTree
```

#### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
echo "GEMINI_API_KEY=your_api_key_here" > .env

# 启动服务 (端口 8000)
python main.py
```

#### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量 (可选，默认连接本地后端)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 启动开发服务器 (端口 3000)
npm run dev
```

#### 获取 Google Gemini API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录 Google 账号
3. 创建新的 API Key
4. 复制 API Key 到环境变量

## 📖 使用指南

### 文件上传功能

1. **支持格式**: PDF、DOCX、TXT、MD、SRT
2. **文件大小**: 最大 10MB
3. **上传方式**: 拖拽上传 或 点击选择
4. **处理速度**: PDF 解析采用 PyMuPDF，速度提升 3-5 倍

### 文本输入功能

1. **直接输入**: 在文本框中输入任意内容
2. **格式支持**: 支持 Markdown 和纯文本
3. **长度限制**: 建议 4000 字符以内
4. **实时处理**: 点击生成即时处理

### AI 处理特性

- **无损信息**: 零信息损失，保留所有关键细节
- **结构识别**: 自动识别文档逻辑结构
- **智能提炼**: 将内容转换为结构化思维导图
- **中文优化**: 针对中文内容优化处理效果

## 🔥 v2.0.0 新功能

### ✅ 用户认证系统 (后端完成)

- **用户注册**: 安全的邮箱密码注册流程
- **用户登录**: JWT 令牌认证，7 天有效期
- **密码安全**: bcrypt 哈希加密，防止明文存储
- **数据验证**: 邮箱格式、密码强度验证
- **令牌管理**: 自动令牌生成、验证、解析

### ✅ 数据库架构

- **PostgreSQL**: 企业级云端数据库
- **SQLAlchemy ORM**: 类型安全的数据库操作
- **用户模型**: 完整的用户信息和状态管理
- **自动建表**: 应用启动时自动创建数据结构
- **数据持久化**: 用户数据永久安全存储

### 🔄 前端认证 (开发中)

- **认证页面**: `/login` 和 `/register` 页面设计
- **状态管理**: React Context 全局用户状态
- **令牌存储**: 安全的 JWT 令牌本地存储
- **路由保护**: 私有路由和认证中间件
- **用户界面**: 导航栏用户菜单和个人信息

### 🎯 v2.0.0 技术升级

- **认证架构**: JWT + bcrypt + PostgreSQL
- **API 接口**: RESTful 认证 API，完整的 Swagger 文档
- **安全特性**: SQL 注入防护，密码哈希，令牌验证
- **个人化**: 从匿名工具到个人化应用的转变

## 📊 v1.2.0 已完成功能

### ✅ 云端部署

- **Render 平台**: 稳定的云端运行环境
- **全球访问**: 新加坡节点，低延迟高性能
- **HTTPS 安全**: 全程加密传输
- **自动扩容**: 根据访问量自动调整资源

### ✅ 文档上传优化

- **多格式支持**: PDF、Word、文本、字幕文件
- **高性能解析**: PyMuPDF 库集成，处理速度显著提升
- **界面简化**: 移除复杂选项，专注核心功能
- **错误处理**: 完善的错误提示和重试机制

### ✅ AI 处理升级

- **知识架构师模板**: 专业级信息提取 prompt
- **结构保留**: 识别并保持原文逻辑层次
- **精确提炼**: 具体化呈现替代模糊概括
- **完整性检查**: 确保信息无遗漏

## 🔧 开发调试

### 端口冲突解决

如果遇到端口被占用问题：

```bash
# 查看端口占用
lsof -i :3000  # 前端端口
lsof -i :8000  # 后端端口

# 终止进程
kill -9 <PID>

# 或使用项目提供的一键启动脚本
./start_services.sh
```

### 诊断工具

```bash
# 检查服务状态
curl http://localhost:8000/health
curl http://localhost:3000

# 检查 API 连通性
curl -X POST http://localhost:8000/api/process-text \
  -H "Content-Type: application/json" \
  -d '{"text":"测试文本","format_type":"standard"}'
```

### 常见问题

1. **API 连接失败**: 检查后端服务是否启动，端口是否正确
2. **思维导图不显示**: 检查浏览器控制台错误，确认 markmap 资源加载
3. **文件上传失败**: 检查文件格式和大小，确认后端文件解析库安装

## 📊 项目状态

### 当前版本: v2.0.0 🔥 开发中

- **状态**: 🔥 用户认证系统开发中
- **后端**: 完整的认证 API 和数据库架构
- **前端**: 认证页面和状态管理待开发
- **部署**: 后端 v2.0.0 准备部署测试

### v2.0.0 功能覆盖

- ✅ **用户认证**: JWT 令牌 + PostgreSQL 数据库
- ✅ **数据持久化**: 云端数据库永久存储
- ✅ **安全加密**: bcrypt 密码哈希 + 数据验证
- ✅ **文档上传**: PDF、DOCX、TXT、MD、SRT
- ✅ **AI 处理**: Google Gemini 智能解析
- ✅ **思维导图**: Markmap 专业渲染
- ✅ **云端服务**: Render 平台 + PostgreSQL

### v2.0.0 技术指标

- **认证系统**: JWT 令牌 7 天有效期
- **数据库**: PostgreSQL 企业级云端存储
- **安全性**: bcrypt + SQLAlchemy ORM 防注入
- **API 性能**: RESTful 接口 + 自动文档生成
- **文件解析**: PDF 处理速度提升 3-5 倍
- **AI 响应**: 平均 3-8 秒生成思维导图

## 🗺️ 发展规划

### v2.0.0 完整版 (开发中)

- **前端认证**: 登录/注册页面，用户状态管理
- **路由保护**: 私有路由和认证中间件
- **个人化**: 思维导图保存和历史记录
- **用户界面**: 导航栏用户菜单和个人信息

### v3.0.0 功能增强

- **编辑功能**: 节点编辑、手动调整、样式定制
- **导出功能**: PNG、PDF、SVG 多格式导出
- **分享协作**: 分享链接、权限控制、实时协作
- **团队功能**: 工作区、协作编辑、权限管理

### 长期愿景

- **企业级功能**: 团队工作区、数据分析、API 开放
- **AI 能力扩展**: 多模型支持、智能建议、内容优化
- **国际化**: 多语言界面、全球节点部署
- **移动端**: 原生 App、离线功能、跨设备同步

## 🤝 贡献指南

### 开发贡献

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 问题反馈

- **Bug 报告**: 请提供详细的错误信息和复现步骤
- **功能建议**: 欢迎提出改进建议和新功能想法
- **文档改进**: 帮助完善项目文档和使用指南

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [FastAPI](https://fastapi.tiangolo.com/) - 现代 Python Web 框架
- [Markmap](https://markmap.js.org/) - 思维导图可视化库
- [Google Gemini](https://ai.google.dev/) - AI 内容生成服务
- [Render](https://render.com/) - 云端部署平台
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架

---

**开发团队**: ThinkTree Team  
**最后更新**: 2024-07-22  
**项目状态**: 🔥 v2.0.0 用户认证系统开发中 - 后端完成，前端开发中  
**在线地址**: https://thinktree-frontend.onrender.com
