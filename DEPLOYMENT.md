# ThinkTree 部署指南

## 🚀 Render 部署（推荐）

### 前端部署 (Next.js 到 Render)

1. **创建 Web Service**
   - 连接 GitHub 仓库
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **环境变量配置**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
   ```

### 后端部署 (FastAPI 到 Render)

1. **创建 Web Service**
   - 连接 GitHub 仓库  
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **环境变量配置**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SECRET_KEY=your_secret_key_32_chars_minimum
   DATABASE_URL=sqlite:///./thinktree.db
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

## 🐛 常见问题

**CORS 错误**: 检查前端API_URL配置
**API密钥错误**: 验证GEMINI_API_KEY有效性
**Markmap不显示**: 检查浏览器控制台错误

---
**技术栈**: Next.js 14 + FastAPI + Markmap + Google Gemini AI