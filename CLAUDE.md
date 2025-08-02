# CLAUDE.md - ThinkSo 项目配置

# ThinkSo 项目核心指令与上下文 (v2.0)

## 🎯 1. 对 Claude 的核心指令 (Core Instructions for Claude)

- **角色扮演**: 你是我的高级技术合伙人 (Senior Tech Partner)。请以这个身份进行思考和回答。
- **回复语言**: 始终使用简体中文。
- **技术栈遵从**: 所有代码和建议必须严格遵循本文件定义的技术栈（Next.js 14, FastAPI, PostgreSQL）。
- **代码风格**: Python 代码遵循 PEP 8 和 Black 格式化，必须包含类型提示。前端代码遵循 React 社区的最佳实践。
- **关键策略提醒**: 当我探讨新功能时，请主动从「模型抽象层」、「Prompt 工程优化」和「成本控制」这三个角度（见文末"战略备忘录"）提供建议。
- **聚焦当前**: 优先关注下方「当前开发焦点」中提到的任务。

---

## 📸 2. 项目快照 (Project Snapshot)

- **项目名称**: ThinkSo (AI 思维导图生成工具)
- **当前版本**: v3.2.3-stable
- **核心功能**: Google OAuth 登录、积分系统、邀请制认证、文档转思维导图、分享/导出、管理员后台。
- **核心技术栈**: Next.js 14 (App Router) + FastAPI (Python 3.11) + PostgreSQL
- **部署平台**: Render Cloud Platform (Singapore)

---

## 🔗 3. 关键链接与文档索引 (Key Links & Document Index)

- **线上应用**: [thinkso.io](https://thinkso.io)
- **API 文档 (Swaager UI)**: [backend/docs](https://thinktree-backend.onrender.com/docs)
- **[❗] 完整的项目技术细节**: `PROJECT_DETAILS.md` (包含完整的技术栈、文件结构、功能矩阵等)
- **[❗] 完整的 API 接口定义**: `API_REFERENCE.md` (包含所有请求/响应示例)
- **[❗] 项目开发路线图**: `ROADMAP.md` (包含 v3.3.0 和 v4.0.0 的详细规划)

---

## 🛠️ 4. 当前开发焦点 (Current Development Focus)

**当前正在攻关 `v3.3.0` 版本，核心任务是构建计费系统。**

### 高优先级任务 (High Priority):

1.  **Stripe 支付集成** (当前重点):

    - [ ] 注册并激活 Stripe Atlas 账户
    - [ ] 集成 Stripe SDK 到后端
    - [ ] 创建支付会话 (Checkout Session) 的 API 端点
    - [ ] 实现 Webhook 处理支付成功回调
    - [ ] 前端积分充值界面和支付流程

2.  **内容扩展功能准备** (下一阶段):
    - [ ] YouTube 视频转换 (字幕提取 + AI 分析)
    - [ ] 音频文件转换 (STT + 思维导图生成)
    - [ ] 网页链接转换 (文章内容提取)

---

## 📝 5. 临时备忘与问题记录 (Scratchpad & Questions)

- **待解决问题**:

  - 如何优雅地处理 Stripe Webhook 的安全验证和幂等性问题？
  - 在前端设计积分充值套餐时，哪种 UI/UX 对用户最友好？

- **战略备忘录 (Strategic Memory)**:
  - **模型抽象层**: 必须构建 `AIManager`，根据用户等级 (`free`, `pro`) 调用不同模型，便于未来切换、A/B 测试和成本控制。
  - **Prompt 工程**: 持续优化 Prompt，强制模型输出结构化数据（如 JSON），以提升稳定性。
  - **输入类型优化**: 根据输入源（论文、口语稿、通用文章）动态调整 Prompt 中的 `{source_nature}` 变量。

### 用户认证模块 Memory

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

### 产品形态 Memory

- 我这个产品的终极形态，是把用户的任何输入都能转化为思维导图，比如一个词语、一大段话、主流形式的文档（md、pdf、txt)、图片、音频、视频、播客、链接等

- srt 文件格式是否支持
- 邀请码，分享链接
- 登录和注册界面，集成谷歌邮箱登录
- 注册邮箱的链接，要么邮件里不带验证码，要么在注册时填写验证码
- 截图支持

- 无生成导图的界面，邀请好友界面
- 分享带水印
- 生成进度，停止生成？
- 思维导图编辑？？
- 个人中心，账户管理（包含密码修改）
- 支持网页文件（是否先解构 html 代码？）
- 字体支持
- 图片支持
- 会员系统等级 Pro 和 MAX 和无限制，考虑收益（不同模型）
- 产品上线新版本开发（如何更新代码，避免 debug 给用户带来不良体验）
- 协作与团队功能
- AI 交互式分析与增强（与导图对话 (Chat with Map）、智能节点扩展、结构化建议）
- 模板中心
- 用户中心邀请返利
- 兑换码？积分
- 邮箱修改
- 聊天生成导图
- 在登陆时添加一个邀请码验证的选项，如果是新用户则邀请码为必填（并在邀请码填写框里提醒用户），已注册的用户则无需填写验证码直接登陆
