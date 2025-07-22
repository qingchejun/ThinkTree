# 🌳 ThinkTree - AI 驱动的思维导图生成工具

将文档内容转换为专业思维导图，基于 Google Gemini AI 和 Markmap 可视化技术。

**当前版本**: v1.1.0 - 文档上传功能完成

## ✨ 功能特性

- 🤖 **AI 智能解析**: 基于 Google Gemini API 智能提取文档关键信息
- 📁 **多格式上传**: 支持 PDF、DOCX、TXT、MD、SRT 等多种文档格式
- 🎯 **拖拽上传**: 现代化的文件上传体验，支持拖拽和点击选择
- 🗺️ **Markmap 渲染**: 使用 markmap-lib 和 markmap-view 生成专业思维导图
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🔄 **自适应布局**: 思维导图自动适应窗口大小，支持缩放和拖拽
- ⚡ **实时生成**: 输入文本即时生成思维导图
- 🎨 **现代 UI**: 基于 Tailwind CSS 的美观界面

## 🛠️ 技术栈

**前端**

- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- markmap-view + markmap-lib
- D3.js

**后端**

- FastAPI (Python 3.11)
- Google Gemini AI API
- 异步文件处理

**部署**

- 开发环境: localhost
- 生产环境: Render (计划中)

## 🏗️ 项目架构

### 数据流

```
用户输入/文件上传 → FastAPI后端 → Gemini AI处理 →
Markdown结构数据 → markmap-lib转换 → markmap-view渲染思维导图
```

### 目录结构

```
ThinkTree/
├── frontend/                 # Next.js前端
│   ├── app/                 # App Router页面
│   │   ├── page.jsx        # 主页
│   │   ├── test/           # 思维导图测试页
│   │   ├── editor/         # 编辑器页面
│   │   └── ...
│   ├── components/          # React组件
│   │   └── mindmap/        # 思维导图组件
│   │       ├── SimpleMarkmap.jsx  # 简化版Markmap组件
│   │       └── MarkmapView.jsx    # 完整版Markmap组件
│   └── styles/             # 样式文件
├── backend/                 # FastAPI后端
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心模块
│   │   │   ├── ai_processor.py    # AI处理器
│   │   │   ├── config.py          # 配置管理
│   │   │   └── file_parser.py     # 文件解析器
│   │   └── models/         # 数据模型
│   └── main.py             # FastAPI应用入口
├── DEPLOYMENT.md           # 部署指南
├── 任务清单.md             # 开发任务跟踪
└── CLAUDE.md               # Claude配置
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- Python >= 3.11
- Google Gemini API Key

### 🔧 端口冲突解决方案

如果遇到 `localhost:3000` 无法访问的问题，这通常是端口被占用导致的。我们提供了一键解决方案：

#### 方法 1: 快速诊断 (推荐)

```bash
# 诊断服务状态，获取具体解决建议
./diagnose.sh
```

#### 方法 2: 使用一键启动脚本

```bash
# 清理所有进程并重新启动服务
./start_services.sh
```

#### 方法 3: 手动清理进程

```bash
# 清理占用端口的进程
pkill -f "next-server"
pkill -f "npm.*dev"
pkill -f "uvicorn.*8000"

# 等待进程完全结束
sleep 3

# 重新启动服务 (见下方启动步骤)
```

#### 方法 4: 检查端口占用

```bash
# 检查3000端口占用情况
lsof -i :3000

# 检查8000端口占用情况
lsof -i :8000

# 如有需要，手动结束特定进程
kill -9 <PID>
```

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd ThinkTree
```

### 2. 启动后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 GEMINI_API_KEY

# 启动服务
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 4. 访问应用

- **主页**: http://localhost:3000
- **思维导图生成器**: http://localhost:3000/test
- **后端 API 文档**: http://localhost:8000/docs

## 🛠️ 开发调试技巧

### 常见问题解决

1. **前端服务无法启动**

   - 检查 Node.js 版本是否 >= 18.0.0
   - 清理 `node_modules` 并重新安装: `rm -rf node_modules && npm install`
   - 检查 3000 端口是否被占用: `lsof -i :3000`

2. **后端 API 无响应**

   - 确保虚拟环境已激活: `source venv/bin/activate`
   - 检查依赖是否完整: `pip install -r requirements.txt`
   - 验证环境变量配置: 确保 `.env` 文件存在且包含 `GEMINI_API_KEY`

3. **AI 功能报错**
   - 验证 Google Gemini API Key 是否有效
   - 检查网络连接是否正常
   - 查看后端日志获取详细错误信息

### 服务状态检查

```bash
# 检查后端健康状态
curl http://localhost:8000/health

# 检查前端是否响应
curl http://localhost:3000

# 查看运行中的相关进程
ps aux | grep -E "(next|uvicorn)" | grep -v grep
```

## 💡 避免端口冲突的最佳实践

1. **使用专用启动脚本**: 项目根目录的 `start_services.sh` 会自动清理冲突进程
2. **规范退出流程**: 开发完成后使用 `Ctrl+C` 正常退出服务，避免僵尸进程
3. **定期清理**: 定期检查并清理不需要的 Node.js 和 Python 进程
4. **端口监控**: 开发前先检查端口占用情况，避免冲突

## 🔧 环境配置

### 后端环境变量 (backend/.env)

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_32_chars_minimum
DATABASE_URL=sqlite:///./thinktree.db
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads
```

### 前端环境变量 (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📖 使用指南

1. 访问思维导图生成器页面
2. 在左侧文本框输入要转换的内容
3. 点击"🚀 生成思维导图"按钮
4. 在右侧查看生成的思维导图
5. 使用鼠标拖拽和滚轮缩放调整视图
6. 点击"🔍 适应"按钮自动调整到最佳视图

## 🔄 版本历史

### v1.0.0 (2024-07-22) - 当前版本

- ✅ 完整的 AI 思维导图生成功能
- ✅ Markmap 集成，支持连线和交互
- ✅ 自适应窗口大小功能
- ✅ 响应式 UI 设计
- ✅ 主页和测试页面完善

### 计划中功能 (v1.1.0)

- 📁 文档上传功能 (PDF/TXT/DOCX/SRT/MD)
- ☁️ Render 云部署
- 👤 用户认证系统
- 💾 思维导图保存功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙏 致谢

- [Google Gemini AI](https://ai.google.dev/) - AI 文本处理
- [Markmap](https://markmap.js.org/) - 思维导图可视化
- [Next.js](https://nextjs.org/) - React 框架
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web 框架

---

**让思维如树般清晰展现** 🌳
