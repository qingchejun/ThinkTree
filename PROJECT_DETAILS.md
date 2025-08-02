# CLAUDE.md - ThinkSo 项目配置

## 🎯 项目概述

**ThinkSo** 是一个 AI 驱动的思维导图生成工具，对标 Mapify.so，使用先进的技术栈实现文档到思维导图的智能转换。

**当前版本**: v3.2.3-stable - Google OAuth登录 + 完整积分系统 + 用户中心 + 邀请制认证 + 管理员后台 🎉

### 核心技术架构

```
邀请码注册 → 邮件验证 → JWT认证 → 用户中心 → 思维导图管理 → AI处理与存储 → 分享/导出
技术栈: Next.js 14 + FastAPI + PostgreSQL + JWT + Google Gemini AI + Markmap + 邀请制系统
安全特性: 速率限制 + 密码强度验证 + reCAPTCHA + 邮件验证 + 管理员后台
部署: Render Cloud Platform (Singapore) - 前后端全栈部署 + 自动化数据库迁移
```

### 🌐 线上地址

- **前端**: https://thinkso.io
- **后端**: https://thinktree-backend.onrender.com
- **API 文档**: https://thinktree-backend.onrender.com/docs
- **健康检查**: https://thinktree-backend.onrender.com/health

### 🔐 完整认证系统

- **Google OAuth 登录**: 一键 Google 登录 + 账户关联
- **邀请码注册**: https://thinkso.io/register
- **邮件验证**: 注册后邮件激活
- **用户登录**: https://thinkso.io/login (支持传统登录 + Google OAuth)
- **用户中心**: https://thinkso.io/settings
- **个人控制台**: https://thinkso.io/dashboard
- **思维导图创建**: https://thinkso.io/create
- **分享功能**: 支持公开分享链接
- **导出功能**: SVG/PNG 格式导出
- **管理员后台**: 用户管理 + 统计监控

### 💰 积分系统

- **积分计量**: AI 调用按消耗计费，透明成本控制
- **每日奖励**: 登录获得积分奖励，提升用户活跃度
- **兑换码系统**: 积分兑换码生成、校验和兑换
- **积分明细**: 完整的消费记录和明细追踪
- **余额显示**: 导航栏实时显示积分余额
- **成本预估**: 操作前预估积分消耗

## 🛠️ 技术栈详情

### 前端 (Next.js 14)

- **框架**: Next.js 14 App Router
- **UI 库**: React 18 + Tailwind CSS 3
- **认证系统**: JWT 存储 + React Context + 表单验证
- **思维导图**: markmap-view + markmap-lib + D3.js + 展开折叠交互
- **分享系统**: 动态路由 + 公开访问页面
- **导出系统**: SVG 直接导出 + Canvas PNG 转换
- **通知系统**: Toast 消息替代 alert
- **交互功能**: 展开/折叠节点，自适应视图，缩放控制
- **特性**: 响应式设计，自适应布局，实时渲染
- **部署**: Render (Singapore) + 环境变量自适应

### 后端 (FastAPI)

- **框架**: FastAPI + Python 3.11
- **数据库**: PostgreSQL + SQLAlchemy ORM + Alembic 迁移
- **认证系统**: JWT + bcrypt + 邀请码系统 + 邮件验证
- **安全系统**: 速率限制(slowapi) + 密码强度验证 + reCAPTCHA + CORS
- **邀请系统**: InvitationCode 模型 + 使用限制 + 统计管理
- **分享系统**: Token 生成 + 权限控制
- **用户中心**: 个人资料管理 + 密码修改 + 邀请码管理
- **管理后台**: 用户管理 + 统计仪表盘 + 邀请码管理
- **AI 引擎**: Google Gemini API
- **文件处理**: PyMuPDF + pdfplumber + python-docx
- **邮件服务**: fastapi-mail + 验证邮件 + 密码重置
- **API 设计**: RESTful API + 自动文档生成
- **启动系统**: 自动数据库迁移 + 条件初始化
- **部署**: Render (Singapore) + gunicorn + 云端数据库

### 文档解析能力

- **PDF**: PyMuPDF (高性能) + pdfplumber (备用)
- **Word**: python-docx (DOCX 格式)
- **文本**: TXT, MD, SRT 字幕文件
- **上传**: 文件大小限制 10MB，拖拽上传支持

## 📁 项目结构

```
ThinkTree/
├── frontend/                    # Next.js前端应用
│   ├── app/                    # App Router页面目录
│   │   ├── page.jsx           # 主页 (/)
│   │   ├── create/page.jsx    # 思维导图创建页 (/create)
│   │   ├── editor/page.jsx    # 编辑器页面 (/editor)
│   │   ├── login/page.jsx     # 登录页面 (/login)
│   │   ├── register/page.jsx  # 注册页面 (/register) - 邀请码注册
│   │   ├── verify-email/page.jsx # 邮件验证页面 (/verify-email)
│   │   ├── dashboard/page.jsx # 控制台页面 (/dashboard)
│   │   ├── settings/          # 用户中心页面目录
│   │   │   ├── page.jsx      # 用户设置主页 (/settings)
│   │   │   ├── profile/      # 个人资料页面
│   │   │   ├── security/     # 安全设置页面
│   │   │   ├── billing/      # 计费页面
│   │   │   └── invitations/  # 邀请管理页面
│   │   ├── admin/            # 管理员后台页面目录
│   │   │   ├── dashboard/    # 管理员仪表盘
│   │   │   ├── users/        # 用户管理页面
│   │   │   └── invitations/  # 邀请码管理页面
│   │   ├── mindmap/[id]/page.jsx # 思维导图查看页
│   │   ├── share/[token]/page.jsx # 分享页面
│   │   ├── layout.jsx         # 根布局
│   │   ├── not-found.jsx      # 404页面
│   │   └── error.jsx          # 错误页面
│   ├── components/             # React组件
│   │   ├── mindmap/           # 思维导图组件
│   │   │   ├── SimpleMarkmapBasic.jsx   # 稳定版Markmap组件
│   │   │   ├── MarkmapView.jsx          # 原始Markmap组件
│   │   │   ├── SimpleMindMap.jsx        # 备用简单组件
│   │   │   └── ThinkTreeEditor.jsx      # 编辑器组件
│   │   ├── upload/            # 文件上传组件
│   │   │   └── FileUpload.jsx      # 文件上传和文本输入
│   │   ├── common/            # 通用组件
│   │   │   ├── ErrorBoundary.jsx   # 错误边界
│   │   │   ├── Toast.jsx           # 消息提示
│   │   │   └── AuthStatus.jsx      # 认证状态组件
│   │   ├── share/             # 分享相关组件
│   │   │   └── ShareModal.jsx      # 分享模态框
│   │   └── context/           # React Context
│   │       └── AuthContext.jsx     # 认证上下文
│   ├── lib/                   # 工具库
│   │   └── api.js            # API调用封装
│   ├── styles/               # 样式文件
│   │   ├── globals.css       # 全局样式
│   │   └── markmap.css       # Markmap专用样式
│   ├── package.json          # 前端依赖配置
│   └── next.config.js        # Next.js配置
├── backend/                     # FastAPI后端应用
│   ├── app/                    # 应用核心代码
│   │   ├── api/               # API路由
│   │   │   ├── upload.py     # 文件上传和文本处理
│   │   │   ├── mindmaps.py   # 思维导图CRUD
│   │   │   ├── auth.py       # 用户认证 + 用户中心
│   │   │   ├── share.py      # 分享功能
│   │   │   ├── invitations.py # 邀请码管理
│   │   │   └── admin.py      # 管理员后台
│   │   ├── core/             # 核心模块
│   │   │   ├── ai_processor.py    # Google Gemini AI处理器
│   │   │   ├── file_parser.py     # 文件解析器
│   │   │   ├── database.py        # 数据库配置
│   │   │   └── config.py          # 配置管理
│   │   ├── models/           # 数据模型
│   │   │   ├── user.py            # 用户数据模型 + is_verified + 积分系统
│   │   │   ├── mindmap.py         # 思维导图数据模型
│   │   │   └── invitation.py     # 邀请码数据模型
│   │   └── utils/            # 工具函数
│   │       └── security.py        # 安全工具和JWT处理
│   ├── alembic/              # 数据库迁移
│   │   ├── versions/         # 迁移脚本
│   │   ├── env.py           # 迁移环境配置
│   │   └── alembic.ini      # 迁移配置文件
│   ├── main.py               # FastAPI主入口
│   ├── start.sh             # 生产环境启动脚本
│   ├── requirements.txt      # Python依赖
│   └── uploads/             # 上传文件临时存储
├── README.md                   # 项目说明文档
├── CLAUDE.md                  # 项目配置文档（本文件）
├── 任务清单.md                # 开发任务跟踪
├── render.yaml               # Render部署配置
└── DEPLOYMENT.md              # 部署指南
```

## 🚀 v3.2.2-stable 重大成就

### 🔐 完整用户管理系统 (关键突破)

**邀请制认证系统**:

- ✅ **邀请码系统**: InvitationCode 模型 + 使用限制 + 统计管理
- ✅ **邮件验证**: 注册验证 + 密码重置 + fastapi-mail 集成
- ✅ **安全增强**: 速率限制 + 密码强度验证 + reCAPTCHA
- ✅ **用户中心**: 个人资料管理 + 密码修改 + 邀请码管理

**管理员后台系统**:

- ✅ **统计仪表盘**: 用户数量 + 思维导图统计 + 今日新增数据
- ✅ **用户管理**: 用户列表 + 搜索筛选 + 状态管理 + 批量操作
- ✅ **邀请码管理**: 生成邀请码 + 使用统计 + 权限控制
- ✅ **操作日志**: 管理员操作记录 + 安全审计

**技术架构完善**:

- ✅ **数据库升级**: User.is_verified + InvitationCode 表 + Alembic 迁移
- ✅ **API 接口完整**: 认证 + 用户中心 + 管理后台 + 邀请系统
- ✅ **前端界面**: 注册验证 + 用户设置 + 管理员后台
- ✅ **安全防护**: JWT + bcrypt + 速率限制 + 输入验证

### 🎯 完整功能矩阵

**核心功能 (100%完成)**:

- ✅ 邀请制认证系统 - 邀请码注册/邮件验证/JWT 认证/权限控制
- ✅ 思维导图生成 - AI 处理/多格式文档/实时渲染
- ✅ 数据持久化 - PostgreSQL 存储/用户数据管理/关联查询
- ✅ 个人控制台 - Dashboard/思维导图管理/CRUD 操作
- ✅ 用户中心 - 个人资料/密码管理/邀请码系统

**高级功能 (100%完成)**:

- ✅ 分享系统 - 公开链接/权限控制/Token 管理
- ✅ 导出功能 - SVG/PNG 格式/高清质量/文件下载
- ✅ 展开折叠功能 - 智能节点控制/概览详细切换/用户体验优化
- ✅ 管理员后台 - 统计仪表盘/用户管理/邀请码管理/操作日志
- ✅ 安全防护 - 速率限制/密码验证/reCAPTCHA/邮件验证
- ✅ 用户体验 - Toast 通知/响应式设计/错误处理
- ✅ 生产部署 - 自动化迁移/环境配置/稳定运行

### 🔐 分享功能架构

**后端分享 API**:

- `POST /api/mindmaps/{id}/share` - 创建分享链接
- `GET /api/share/{token}` - 公开访问分享内容
- `DELETE /api/mindmaps/{id}/share` - 禁用分享
- `GET /api/mindmaps/{id}/share` - 获取分享状态

**前端分享组件**:

- **ShareModal.jsx** - 完整的分享对话框
- **分享按钮** - Dashboard 和查看页面集成
- **公开页面** - `/share/[token]` 无需登录访问
- **复制功能** - 一键复制分享链接

**数据库架构**:

```sql
-- Mindmap表扩展
ALTER TABLE mindmaps ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE mindmaps ADD COLUMN share_token VARCHAR(255) UNIQUE;
CREATE INDEX idx_mindmaps_share_token ON mindmaps(share_token);
```

### 🎨 导出功能架构

**SVG 格式导出**:

- 直接提取 Markmap SVG 元素
- 完美保真的矢量图形
- 一键下载，自动文件命名

**PNG 格式导出**:

- SVG 转 Canvas 高清转换
- 支持高分辨率输出
- 浏览器原生下载功能

**导出 UI 集成**:

- 查看页面、Dashboard、分享页面全覆盖
- 导出按钮样式和图标优化
- Toast 通知成功反馈

## 🔧 API 接口文档

### 思维导图管理接口

```http
POST /api/mindmaps
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "思维导图标题",
  "description": "描述信息",
  "content": "# Markdown内容\n## 节点信息...",
  "tags": "标签1,标签2"
}
```

```http
GET /api/mindmaps/{mindmap_id}
Authorization: Bearer {jwt_token}

响应:
{
  "id": "uuid",
  "title": "标题",
  "content": "Markdown内容",
  "is_public": false,
  "share_token": null,
  "created_at": "2024-07-23T..."
}
```

### 分享功能接口

```http
POST /api/mindmaps/{mindmap_id}/share
Authorization: Bearer {jwt_token}

响应:
{
  "success": true,
  "share_url": "https://thinkso.io/share/abc123"
}
```

```http
GET /api/share/{share_token}
# 无需认证，公开访问

响应:
{
  "title": "分享的思维导图",
  "content": "# Markdown内容...",
  "created_at": "2024-07-23T..."
}
```

### 文档处理接口

```http
POST /api/upload
Content-Type: multipart/form-data

参数:
- file: 上传的文件 (PDF/DOCX/TXT/MD/SRT)
- format_type: 固定为 "standard"

响应:
{
  "success": true,
  "data": "# 思维导图标题\n## 主要内容..."
}
```

```http
POST /api/process-text
Content-Type: application/json

参数:
{
  "text": "要处理的文本内容",
  "format_type": "standard"
}

响应:
{
  "success": true,
  "data": "# 思维导图标题\n## 主要内容..."
}
```

### 用户认证和管理接口

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "strongPassword123",
  "invitation_code": "INV_ABC123",
  "display_name": "用户名"
}
```

```http
PUT /api/auth/profile
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "display_name": "新用户名"
}
```

```http
PUT /api/auth/password
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "current_password": "oldPassword",
  "new_password": "newPassword123",
  "confirm_password": "newPassword123"
}
```

### Google OAuth 认证接口

```http
GET /api/auth/google
重定向到 Google OAuth 授权页面
```

```http
GET /api/auth/google/callback
处理 Google OAuth 回调
参数: code, state (由 Google 自动添加)
成功后重定向到: /auth/callback?token={jwt}&daily_reward={true/false}
```

```http
GET /api/auth/google/test-info
Authorization: Bearer {jwt_token}

响应:
{
  "google_id": "用户的Google ID或'未关联'",
  "email": "user@example.com",
  "name": "用户显示名称",
  "avatar_url": "头像URL",
  "is_new_user": true
}
```

### 积分系统接口

```http
GET /api/me/credits/history
Authorization: Bearer {jwt_token}
Query: page=1&limit=20

响应:
{
  "transactions": [
    {
      "id": 1,
      "amount": -100,
      "transaction_type": "deduction",
      "description": "AI思维导图生成",
      "created_at": "2025-08-02T10:00:00Z"
    }
  ],
  "total": 50,
  "current_credits": 9900
}
```

```http
POST /api/codes/redeem
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "code": "REDEEM123"
}

响应:
{
  "success": true,
  "credits_added": 1000,
  "new_balance": 10900,
  "message": "兑换成功！获得 1000 积分"
}
```

### 邀请码管理接口

```http
POST /api/invitations/create
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "description": "邀请朋友",
  "expires_hours": 168
}
```

```http
GET /api/invitations/list
Authorization: Bearer {jwt_token}

响应:
[
  {
    "id": 1,
    "code": "INV_ABC123",
    "is_used": false,
    "created_at": "2025-07-26T...",
    "invitation_link": "https://thinkso.io/register?code=INV_ABC123"
  }
]
```

### 管理员后台接口

```http
GET /api/admin/stats
Authorization: Bearer {admin_jwt_token}

响应:
{
  "total_users": 150,
  "active_users": 142,
  "verified_users": 138,
  "total_mindmaps": 1203,
  "total_invitations": 45,
  "used_invitations": 32,
  "today_new_users": 5,
  "today_new_mindmaps": 23
}
```

```http
GET /api/admin/users?page=1&per_page=20&search=user@example.com
Authorization: Bearer {admin_jwt_token}

响应:
{
  "users": [...],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "total_pages": 8
}
```

### 健康检查接口

```http
GET /health

响应:
{
  "status": "healthy",
  "version": "3.0.0"
}
```

### API 文档

完整的 API 文档可以通过以下地址访问：

- 在线版本: https://thinktree-backend.onrender.com/docs
- 本地版本: http://localhost:8000/docs

## 🌐 开发环境配置

### 前端环境变量

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://thinktree-backend.onrender.com  # 生产环境
# NEXT_PUBLIC_API_URL=http://localhost:8000                 # 本地开发
```

### 后端环境变量

```bash
# .env
GEMINI_API_KEY=your_google_gemini_api_key
SECRET_KEY=your_secret_key_for_jwt
DATABASE_URL=postgresql://username:password@host:port/database
DEBUG=False  # 生产环境
```

### 本地开发启动

```bash
# 启动后端 (端口 8000)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py

# 启动前端 (端口 3000)
cd frontend
npm install
npm run dev
```

### 云端访问

- **前端**: https://thinkso.io
- **后端**: https://thinktree-backend.onrender.com

## 📊 项目状态

### 当前版本: v3.2.2-stable ✅

- **状态**: 🟢 生产环境完全稳定运行 + 完整用户管理系统 + 管理员后台
- **功能**: 邀请制认证 + 用户中心 + 思维导图管理 + 分享系统 + 导出功能 + 管理员后台
- **安全**: 速率限制 + 密码验证 + reCAPTCHA + 邮件验证 + JWT 认证
- **部署**: Render 平台，自动数据库迁移，PostgreSQL 数据库，环境配置完善
- **体验**: Toast 通知系统，现代化用户界面，完整用户流程，管理员工具

### v3.2.2-stable 完整数据流

```
邀请码获取 → 用户注册(邀请码+邮件验证) → 邮件验证激活 → 用户登录 → JWT认证 →
用户中心(个人资料/密码/邀请码管理) → 个人控制台 →
创建思维导图 → 文件上传/文本输入 → FastAPI后端处理(速率限制) →
文件解析器提取文本 → Google Gemini AI处理 →
生成Markdown格式数据 → Alembic自动迁移 → PostgreSQL存储 →
查看思维导图 → markmap-lib转换 → markmap-view渲染 → 展开折叠交互 →
分享功能 → Token生成 → 公开访问页面 →
导出功能 → SVG/PNG格式 → 文件下载

管理员流程:
管理员登录 → 超级用户验证 → 管理员后台 →
统计仪表盘(用户/思维导图/邀请码统计) → 用户管理(搜索/筛选/操作) →
邀请码管理(生成/监控/统计) → 操作日志记录
```

### 关键组件说明

1. **FileUpload.jsx**:

   - 支持拖拽上传和文本输入双模式
   - 文件格式验证和大小限制
   - 实时上传状态反馈

2. **SimpleMarkmapBasic.jsx**:

   - 稳定版 Markmap 思维导图渲染组件
   - 自适应窗口大小，支持缩放、拖拽、平移交互
   - **展开折叠功能**: 一键切换详细/概览视图
   - **智能折叠**: 保留根节点和一级分支，隐藏深层细节

3. **ShareModal.jsx**:

   - 完整的分享功能组件
   - 创建/禁用/复制分享链接
   - Toast 通知集成

4. **导出功能组件**:

   - SVG 直接导出 - 完美保真
   - PNG 高清转换 - Canvas 技术
   - 文件命名和下载管理

5. **start.sh**:

   - 生产环境启动脚本
   - 自动运行数据库迁移
   - 确保数据库结构与代码同步

6. **ai_processor.py**:

   - Google Gemini AI 处理器
   - 知识架构师 prompt 模板
   - 无损信息提取算法

7. **share.py**:

   - 分享功能 API 路由
   - Token 生成和验证
   - 权限控制和安全检查

8. **invitations.py**:

   - 邀请码管理 API 路由
   - 邀请码生成和验证
   - 使用统计和权限控制

9. **admin.py**:

   - 管理员后台 API 路由
   - 用户管理和统计功能
   - 操作日志和权限验证

10. **用户中心组件**:

    - 个人资料管理页面
    - 密码修改功能
    - 邀请码管理界面
    - 统一的设置页面布局

11. **管理员后台组件**:
    - 统计仪表盘卡片
    - 用户管理表格
    - 邀请码管理界面
    - 搜索和筛选功能

## 🎉 v3.2.2-stable 功能总览

### ✅ 用户管理系统完成

**邀请制认证系统**:

- ✅ 邀请码注册系统 - InvitationCode 模型 + 使用限制
- ✅ 邮件验证系统 - 注册验证 + 密码重置 + fastapi-mail
- ✅ 安全防护机制 - 速率限制 + 密码验证 + reCAPTCHA
- ✅ 用户状态管理 - is_verified + is_active + 权限控制

**用户中心功能**:

- ✅ 个人资料管理 - 显示名称修改 + 用户信息查看
- ✅ 密码安全管理 - 当前密码验证 + 新密码强度检查
- ✅ 邀请码管理 - 生成邀请码 + 使用统计 + 剩余配额
- ✅ 统一设置界面 - 侧边栏导航 + 模块化页面设计

**管理员后台系统**:

- ✅ 统计仪表盘 - 用户统计 + 思维导图统计 + 今日新增
- ✅ 用户管理功能 - 列表查看 + 搜索筛选 + 状态操作
- ✅ 邀请码管理 - 批量生成 + 使用监控 + 权限控制
- ✅ 操作日志系统 - 管理员操作记录 + 安全审计

**技术架构升级**:

- ✅ 数据库模型扩展 - User.is_verified + InvitationCode 表
- ✅ API 接口完整 - 认证 + 用户中心 + 管理后台
- ✅ 前端界面完善 - 注册验证 + 用户设置 + 管理后台
- ✅ 安全机制加强 - JWT + bcrypt + 速率限制 + 输入验证

**基础功能 (已稳定)**:

- ✅ AI 思维导图生成 - Google Gemini 集成优化
- ✅ 多格式文档解析 - PDF/DOCX/TXT/MD/SRT 高性能处理
- ✅ 分享导出系统 - 公开链接 + SVG/PNG 导出
- ✅ 云端部署架构 - Render 平台 + 自动化迁移
- ✅ API 文档生成 - 自动化接口文档和健康检查

## 🔮 v3.3.0 下一阶段规划

### 积分系统 (高优先级)

- [ ] 积分模型设计 - 用量计量 + 成本控制
- [ ] 积分扣除逻辑 - AI 调用计费 + 明细记录
- [ ] 前端积分显示 - 余额显示 + 消费预估
- [ ] 积分不足处理 - 友好提示 + 充值引导

### 计费系统 (高优先级)

- [ ] Stripe 支付集成 - 安全支付网关
- [ ] 积分充值功能 - 多种充值套餐
- [ ] 订阅计划 - 月度/年度会员制
- [ ] 发票系统 - 支付记录 + 电子发票

### 内容扩展功能 (中优先级)

- [ ] YouTube 视频支持 - 字幕提取 + AI 分析
- [ ] 音频文件处理 - STT + 思维导图生成
- [ ] 播客转换 - RSS Feed + 单集处理
- [ ] 图片 OCR 识别 - 图片文字提取

## 🚀 v4.0.0 长期规划

### 思维导图编辑增强

- [ ] 节点内容编辑 - 直接修改思维导图节点
- [ ] 手动添加/删除节点 - 用户自定义结构
- [ ] 拖拽调整布局 - 可视化结构调整
- [ ] 多种主题系统 - 颜色和样式定制

### 协作功能增强

- [ ] 分享权限控制 - 查看/编辑权限设置
- [ ] 分享链接有效期 - 时间限制管理
- [ ] 分享访问统计 - 访问量和用户分析
- [ ] 实时协作编辑 - 多用户同时编辑

### 企业级功能

- [ ] 团队工作区 - 企业协作空间
- [ ] 版本历史 - 思维导图版本管理
- [ ] 全文搜索 - 内容搜索引擎
- [ ] API 开放 - 第三方应用集成

### 高级导出功能

- [ ] PDF 文档导出 - 完善导出格式支持
- [ ] 高分辨率选项 - 用户可选择导出质量
- [ ] 批量导出功能 - 多个思维导图一次性导出
- [ ] 对话模式 - AI 问答交互

---

**更新日期**: 2025-07-26  
**项目状态**: 🚀 v3.2.2-stable 企业级用户管理系统完整 + 邀请制认证 + 管理员后台  
**技术架构**: 邀请制系统 + 邮件验证 + 用户中心 + 管理后台 + 安全防护 + 稳定部署  
**部署状态**: Render 云平台全栈部署 + PostgreSQL + 自动化数据库管理 + 生产级安全

### 🏆 v3.2.2 重大技术突破

- ✅ **用户管理完整**: 邀请制注册 + 邮件验证 + 用户中心 + 管理后台
- ✅ **安全系统完善**: 速率限制 + 密码验证 + reCAPTCHA + JWT 认证
- ✅ **管理员功能**: 统计仪表盘 + 用户管理 + 邀请码管理 + 操作日志
- ✅ **架构升级**: 数据库扩展 + API 完整 + 前端界面 + 权限控制
- ✅ **生产就绪**: 企业级安全 + 完整用户流程 + 稳定部署

ThinkSo 现已成为企业级思维导图应用，具备完整的用户管理、安全防护、管理监控和内容生成能力！

### 下一步发展重点

根据 feature-checklist.md 规划，v3.3.0 将重点实现：

1. **积分系统** - 用量计量和成本控制
2. **计费功能** - Stripe 集成和积分充值
3. **内容扩展** - 视频/音频/播客支持

### 用户认证模块 Memory

- 个人中心，账户管理（包含密码修改）
- 支持网页文件（是否先解构 html 代码？）
- 字体支持
- 会员系统等级 Pro 和 MAX 和无限制，考虑收益（不同模型）
- 产品上线新版本开发（如何更新代码，避免 debug 给用户带来不良体验）
- 协作与团队功能
- AI 交互式分析与增强（与导图对话 (Chat with Map）、智能节点扩展、结构化建议）
- 模板中心
- 用户中心邀请返利
- 兑换码？积分
- 邮箱修改
- 聊天生成导图
- 重要的战略建议
  构建模型抽象层： 这是最重要的一条技术建议。 不要在你的代码中硬编码调用 client.gemini.generate(...)。你应该创建一个自己的内部服务，例如 AIManager.generate_mindmap(text, user_tier='free')。在这个服务内部，你根据 user_tier 去调用不同的真实模型。这样做有巨大好处：
  随时切换： 当市面上出现更好的模型时，你只需修改 AIManager 的内部逻辑，无需改动整个应用。
  A/B 测试： 你可以轻松地进行 A/B 测试，例如让 10%的付费用户使用 GPT-4o，90%使用 Gemini 1.5 Pro，用数据来决定哪个模型效果更好。
  成本控制： 你可以在这里集中管理 token 限制、超时等策略。

Prompt Engineering 是关键： 模型的选择只是成功的一半。另一半是你的提示工程（Prompt Engineering）。一个精心设计的 Prompt，可以让 Gemini 1.5 Flash 的表现接近一个未经优化的 Gemini 1.5 Pro。你应该持续优化你的 Prompt，使其能稳定地输出你想要的结构化数据（例如，强制要求输出 JSON 格式）。

- 输入类型（可选）

当用户上传 PDF 论文时，你的程序设置 {source_nature} 为 "一篇学术论文摘要"。
当处理 YouTube 视频字幕时，设置为 "一段视频的口语化文稿"。
当处理会议录音时，设置为 "一份会议讨论的记录"。
默认情况下，可以设置为 "一篇通用文章"。

### 问题记录
