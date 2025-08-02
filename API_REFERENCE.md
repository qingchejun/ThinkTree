

# ThinkSo API Reference

## 🔧 API 接口文档

**版本**: v3.2.3-stable  
**基础URL**: https://thinktree-backend.onrender.com  
**认证方式**: JWT Bearer Token  

## 🚀 新增功能

### Google OAuth 认证
- 支持 Google 一键登录
- 自动创建用户账户或关联现有账户
- 与现有 JWT 系统无缝集成

### 积分系统
- AI 调用按积分计费
- 每日登录奖励机制
- 积分兑换码系统
- 完整的积分明细追踪

---

## 📋 认证接口

### Google OAuth 登录

#### 发起 Google 登录
```http
GET /api/auth/google
```

**说明**: 重定向用户到 Google OAuth 授权页面

**响应**: 302 重定向到 Google 授权 URL

---

#### Google OAuth 回调处理
```http
GET /api/auth/google/callback
```

**说明**: 处理 Google OAuth 授权回调

**参数**:
- `code` (query): Google 授权码（自动提供）
- `state` (query): 状态参数（自动提供）

**成功响应**: 302 重定向到前端回调页面
```
/auth/callback?token={jwt_token}&daily_reward={true|false}
```

**错误响应**: 重定向到登录页面并携带错误信息
```
/login?error={error_message}
```

---

#### Google 用户信息测试接口
```http
GET /api/auth/google/test-info
Authorization: Bearer {jwt_token}
```

**响应**:
```json
{
  "google_id": "用户的Google ID或'未关联'",
  "email": "user@example.com", 
  "name": "用户显示名称",
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "is_new_user": true
}
```

---

## 💰 积分系统接口

### 获取积分明细
```http
GET /api/me/credits/history
Authorization: Bearer {jwt_token}
```

**查询参数**:
- `page` (optional): 页码，默认 1
- `limit` (optional): 每页数量，默认 20

**响应**:
```json
{
  "transactions": [
    {
      "id": 1,
      "amount": -100,
      "transaction_type": "deduction",
      "description": "AI思维导图生成",
      "created_at": "2025-08-02T10:00:00Z"
    },
    {
      "id": 2,
      "amount": 10,
      "transaction_type": "reward", 
      "description": "每日登录奖励",
      "created_at": "2025-08-02T09:00:00Z"
    }
  ],
  "total": 50,
  "current_credits": 9900
}
```

---

### 兑换积分代码
```http
POST /api/codes/redeem
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**请求体**:
```json
{
  "code": "REDEEM123"
}
```

**成功响应**:
```json
{
  "success": true,
  "credits_added": 1000,
  "new_balance": 10900,
  "message": "兑换成功！获得 1000 积分"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "兑换码无效或已使用"
}
```

---



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