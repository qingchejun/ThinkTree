# CLAUDE.md - ThinkTree 项目配置

## 🎯 项目概述

**ThinkTree** 是一个 AI 驱动的思维导图生成工具，对标 Mapify.so，使用先进的技术栈实现文档到思维导图的智能转换。

**当前版本**: v1.1.0 - 文档上传功能完成

### 核心技术架构

```
用户输入 → FastAPI后端 → Google Gemini AI → Markdown数据 → markmap-lib转换 → markmap-view渲染
```

## 🛠️ 技术栈详情

### 前端 (Next.js 14)

- **框架**: Next.js 14 App Router
- **UI 库**: React 18 + Tailwind CSS 3
- **思维导图**: markmap-view + markmap-lib + D3.js
- **特性**: 响应式设计，自适应布局，实时渲染

### 后端 (FastAPI)

- **框架**: FastAPI + Python 3.11
- **AI 引擎**: Google Gemini API
- **文件处理**: 异步文件解析和处理
- **API 设计**: RESTful API + 自动文档生成

## 📁 项目结构

```
ThinkTree/
├── frontend/                    # Next.js前端应用
│   ├── app/                    # App Router页面目录
│   │   ├── page.jsx           # 主页 (/)
│   │   ├── test/page.jsx      # 思维导图测试页 (/test)
│   │   ├── editor/page.jsx    # 编辑器页面 (/editor)
│   │   ├── layout.jsx         # 根布局
│   │   ├── not-found.jsx      # 404页面
│   │   └── error.jsx          # 错误页面
│   ├── components/             # React组件
│   │   ├── mindmap/           # 思维导图组件
│   │   │   ├── SimpleMarkmap.jsx    # 主要的Markmap组件
│   │   │   ├── MarkmapView.jsx      # 原始Markmap组件
│   │   │   └── SimpleMindMap.jsx    # 备用简单组件
│   │   ├── common/            # 通用组件
│   │   └── upload/            # 文件上传组件(计划中)
│   ├── styles/                # 样式文件
│   │   ├── globals.css        # 全局样式
│   │   └── markmap.css        # Markmap样式
│   └── package.json           # 前端依赖
├── backend/                    # FastAPI后端应用
│   ├── app/
│   │   ├── api/               # API路由模块
│   │   │   ├── upload.py      # 文件上传和文本处理API
│   │   │   ├── mindmaps.py    # 思维导图管理API
│   │   │   ├── auth.py        # 认证API (计划中)
│   │   │   └── share.py       # 分享功能API (计划中)
│   │   ├── core/              # 核心业务模块
│   │   │   ├── ai_processor.py      # Google Gemini AI处理器
│   │   │   ├── file_parser.py       # 文件解析器
│   │   │   └── config.py            # 配置管理
│   │   ├── models/            # 数据模型 (计划中)
│   │   └── utils/             # 工具函数
│   ├── main.py                # FastAPI应用入口
│   ├── requirements.txt       # Python依赖
│   └── .env                   # 环境变量配置
├── 任务清单.md                 # 开发任务跟踪文档
├── DEPLOYMENT.md              # 部署指南(专注Render)
├── README.md                  # 项目说明文档
└── CLAUDE.md                  # 本文件 - Claude配置和项目状态
```

## 🔧 开发环境配置

### 必需的环境变量

**后端 (backend/.env)**

```env
GEMINI_API_KEY=your_google_gemini_api_key
SECRET_KEY=your_secret_key_32_chars_minimum
DATABASE_URL=sqlite:///./thinktree.db
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
ALLOWED_FILE_TYPES=[".txt", ".md", ".docx", ".pdf", ".srt"]
```

**前端 (frontend/.env.local)**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 启动命令

**后端启动**

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**前端启动**

```bash
cd frontend
npm run dev
```

## 📊 当前项目状态 (v1.0.0)

### ✅ 已完成功能

1. **核心架构**

   - Next.js 14 App Router 前端框架
   - FastAPI 后端 API 服务
   - Google Gemini AI 集成

2. **思维导图功能**

   - ✅ Markmap 集成 (markmap-view + markmap-lib)
   - ✅ AI 生成 Markdown 格式数据
   - ✅ 完整的连线和节点显示
   - ✅ 自适应窗口大小功能
   - ✅ 缩放、拖拽、平移交互
   - ✅ 手动适应按钮

3. **页面和路由**

   - ✅ 主页 (/) - 产品介绍和导航
   - ✅ 测试页 (/test) - 思维导图生成器
   - ✅ 编辑器页 (/editor) - 思维导图编辑
   - ✅ 404 和错误页面处理

4. **API 接口**

   - ✅ `/api/process-text` - 文本处理和 AI 生成
   - ✅ CORS 配置和错误处理
   - ✅ 返回正确的数据格式

5. **文档和部署**
   - ✅ 项目文档完善
   - ✅ Render 部署指南
   - ✅ 开发任务跟踪

### 🔄 进行中/计划中功能

1. **文档上传功能** (v1.1.0 计划)

   - [ ] 前端文件上传组件
   - [ ] 支持 PDF、TXT、DOCX、SRT、MD 格式
   - [ ] 拖拽上传界面
   - [ ] 文件大小和格式验证

2. **云部署** (v1.1.0 计划)

   - [ ] Render 后端服务部署
   - [ ] Render 前端应用部署
   - [ ] 生产环境配置
   - [ ] 域名和 HTTPS 配置

3. **用户系统** (v2.0.0 计划)
   - [ ] 用户注册/登录
   - [ ] 思维导图保存功能
   - [ ] 个人控制台
   - [ ] 分享功能

## 🐛 已知问题和修复记录

### 已修复问题

1. ✅ **Markmap 连线缺失**: 通过正确加载 CSS 和优化配置解决
2. ✅ **主页 404 错误**: 重启 Next.js 开发服务器解决
3. ✅ **API 数据格式不匹配**: 统一后端返回`{success, data}`格式
4. ✅ **思维导图不适应窗口**: 添加 ResizeObserver 和自适应逻辑

### 当前稳定状态

- 🟢 前端服务: http://localhost:3000 正常运行
- 🟢 后端服务: http://localhost:8000 正常运行
- 🟢 AI 功能: Google Gemini API 正常响应
- 🟢 思维导图: Markmap 渲染完全正常

## 💡 开发最佳实践

### 代码规范

- 使用 ES6+现代 JavaScript 语法
- React 函数式组件和 Hooks
- Tailwind CSS 原子化样式
- FastAPI 异步编程模式
- 错误处理和用户反馈

### 调试技巧

- 使用浏览器开发者工具检查 Markmap 渲染
- 后端 API 可通过 `/docs` 查看 Swagger 文档
- 使用 console.log 调试前端状态变化
- 检查网络请求确保前后端通信正常

### 性能优化

- Next.js 自动代码分割
- Markmap 组件懒加载
- API 响应缓存策略
- 图片和资源优化

## 🎯 下阶段开发重点

### 优先级排序

1. **高优先级**: 文档上传功能实现
2. **高优先级**: Render 云部署配置
3. **中优先级**: 用户体验优化
4. **低优先级**: 用户认证系统

### 技术债务

- [ ] 添加单元测试和集成测试
- [ ] API 文档自动生成完善
- [ ] TypeScript 迁移考虑
- [ ] 代码质量检查工具集成

---

**项目维护者**: ThinkTree 开发团队  
**最后更新**: 2024-07-22  
**当前版本**: v1.0.0  
**技术架构**: Next.js + FastAPI + Markmap + Google Gemini AI
