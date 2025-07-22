# CLAUDE.md - ThinkTree 项目配置

## 🎯 项目概述

**ThinkTree** 是一个 AI 驱动的思维导图生成工具，对标 Mapify.so，使用先进的技术栈实现文档到思维导图的智能转换。

**当前版本**: v1.2.0 - 云端部署完成

### 核心技术架构

```
用户输入 → FastAPI后端 → Google Gemini AI → Markdown数据 → markmap-lib转换 → markmap-view渲染
部署: Render Cloud Platform (Singapore)
```

### 🌐 线上地址

- **前端**: https://thinktree-frontend.onrender.com
- **后端**: https://thinktree-backend.onrender.com
- **API 文档**: https://thinktree-backend.onrender.com/docs
- **健康检查**: https://thinktree-backend.onrender.com/health

## 🛠️ 技术栈详情

### 前端 (Next.js 14)

- **框架**: Next.js 14 App Router
- **UI 库**: React 18 + Tailwind CSS 3
- **思维导图**: markmap-view + markmap-lib + D3.js
- **特性**: 响应式设计，自适应布局，实时渲染
- **部署**: Render (Singapore)

### 后端 (FastAPI)

- **框架**: FastAPI + Python 3.11
- **AI 引擎**: Google Gemini API
- **文件处理**: PyMuPDF + pdfplumber + python-docx
- **API 设计**: RESTful API + 自动文档生成
- **部署**: Render (Singapore) + gunicorn

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
│   │   ├── test/page.jsx      # 思维导图测试页 (/test)
│   │   ├── editor/page.jsx    # 编辑器页面 (/editor)
│   │   ├── login/page.jsx     # 登录页面 (/login)
│   │   ├── dashboard/page.jsx # 控制台页面 (/dashboard)
│   │   ├── share/[token]/page.jsx # 分享页面
│   │   ├── layout.jsx         # 根布局
│   │   ├── not-found.jsx      # 404页面
│   │   └── error.jsx          # 错误页面
│   ├── components/             # React组件
│   │   ├── mindmap/           # 思维导图组件
│   │   │   ├── SimpleMarkmap.jsx    # 主要的Markmap组件
│   │   │   ├── MarkmapView.jsx      # 原始Markmap组件
│   │   │   ├── SimpleMindMap.jsx    # 备用简单组件
│   │   │   └── ThinkTreeEditor.jsx  # 编辑器组件
│   │   ├── upload/            # 文件上传组件
│   │   │   └── FileUpload.jsx      # 文件上传和文本输入
│   │   ├── common/            # 通用组件
│   │   │   ├── ErrorBoundary.jsx   # 错误边界
│   │   │   └── Toast.jsx           # 消息提示
│   │   └── share/             # 分享相关组件
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
│   │   │   ├── auth.py       # 用户认证
│   │   │   └── share.py      # 分享功能
│   │   ├── core/             # 核心模块
│   │   │   ├── ai_processor.py    # Google Gemini AI处理器
│   │   │   ├── file_parser.py     # 文件解析器
│   │   │   └── config.py          # 配置管理
│   │   ├── models/           # 数据模型
│   │   └── utils/            # 工具函数
│   ├── main.py               # FastAPI主入口
│   ├── requirements.txt      # Python依赖
│   └── uploads/             # 上传文件临时存储
├── README.md                   # 项目说明文档
├── CLAUDE.md                  # 项目配置文档（本文件）
├── 任务清单.md                # 开发任务跟踪
└── DEPLOYMENT.md              # 部署指南
```

## 🚀 v1.2.0 新功能特性

### ✅ 文档上传功能

- **多格式支持**: PDF、DOCX、TXT、MD、SRT
- **拖拽上传**: 现代化的文件上传体验
- **双模式**: 文件上传 + 直接文本输入
- **性能优化**: PyMuPDF 集成，PDF 解析速度提升 3-5 倍
- **界面简化**: 移除复杂选项，专注核心功能

### ✅ AI 处理优化

- **知识架构师模板**: 专业级信息提取 prompt
- **无损信息原则**: 零信息损失，完整保留关键细节
- **结构保留**: 识别并保持原文逻辑层次关系
- **精确提炼**: 具体化呈现替代模糊概括
- **完整性检查**: 涵盖所有主要观点和支撑论据

### ✅ 云端部署

- **Render 平台**: 前后端完整部署
- **生产环境**: 稳定运行，公网访问
- **环境优化**: CORS 配置、环境变量、依赖管理
- **区域部署**: 新加坡节点，低延迟高性能

## 🔧 API 接口文档

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

### 健康检查接口

```http
GET /health

响应:
{
  "status": "healthy",
  "version": "1.2.0"
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

- **前端**: https://thinktree-frontend.onrender.com
- **后端**: https://thinktree-backend.onrender.com

## 📊 项目状态

### 当前版本: v1.2.0 ✅

- **状态**: 🟢 云端稳定运行
- **功能**: 完整的文档到思维导图生成流程
- **部署**: Render 平台，前后端分离部署
- **性能**: 高质量 AI 处理，流畅的用户体验

### 核心数据流

```
用户操作 → 文件上传/文本输入 → FastAPI后端接收 →
文件解析器提取文本 → Google Gemini AI处理 →
生成Markdown格式数据 → 返回前端 →
markmap-lib转换 → markmap-view渲染思维导图
```

### 关键组件说明

1. **FileUpload.jsx**:

   - 支持拖拽上传和文本输入双模式
   - 文件格式验证和大小限制
   - 实时上传状态反馈

2. **SimpleMarkmap.jsx**:

   - Markmap 思维导图渲染核心组件
   - 自适应窗口大小
   - 支持缩放、拖拽、平移交互

3. **ai_processor.py**:

   - Google Gemini AI 处理器
   - 知识架构师 prompt 模板
   - 无损信息提取算法

4. **upload.py**:
   - 文件上传和文本处理 API
   - 多格式文档解析集成
   - 统一的响应格式

## 🔮 v2.0.0 规划

### 用户系统

- 用户注册/登录功能
- 思维导图保存和历史记录
- 个人控制台和偏好设置

### 功能增强

- 思维导图样式和主题定制
- 节点编辑和手动调整功能
- 多格式导出 (PNG/PDF/SVG)

### 协作功能

- 分享链接和权限控制
- 实时协作编辑
- 评论和版本历史

---

**更新日期**: 2024-07-22  
**项目状态**: 🟢 v1.2.0 云端稳定运行  
**技术架构**: AI → Markdown → markmap-lib → markmap-view  
**部署状态**: Render 云平台完整部署
