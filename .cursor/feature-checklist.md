ThinkSo 功能开发清单
项目: ThinkSo - AI 驱动的思维导图生成工具
当前版本: v3.2.2-stable
目标版本: v3.3.0
最后更新: 2025-07-26

🎯 当前开发功能
Feature: 用户中心基础功能补全
Status: ✅ 已完成
Owner: @thinkso-team
Last Updated: 2025-07-26

🎯 1. 目标与价值 (Objective & Value)
完善用户中心缺失的用户资料更新功能，实现完整的用户管理系统，包括个人资料编辑、密码管理、邀请码系统等核心功能。

✅ 2. 验收标准 (Definition of Done)
[x] 前端用户中心界面 95%已实现
[x] 后端 API 接口完整性检查完成
[x] 缺失的 PUT /api/auth/profile 接口已实现
[x] 用户资料更新功能完整支持
[x] 输入验证和错误处理完善
[x] API 文档和响应模型完整

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)
[x] 分析: 检查现有用户中心 API 接口完整性
[x] 模型: 添加 UserProfileUpdateRequest 请求模型
[x] 模型: 添加 UserProfileUpdateResponse 响应模型
[x] API: 实现 PUT /api/auth/profile 用户资料更新接口
[x] 验证: 显示名称长度和格式验证
[x] 响应: 返回更新后的完整用户信息
[x] 错误处理: 完善异常捕获和回滚机制

前端 / UI (Frontend / UI)
[x] 界面: 用户中心界面已 95%完成
[x] API: updateProfile 函数已在 lib/api.js 中定义
[x] 状态: 用户设置页面四大模块已实现
[x] 功能: 密码更新、邀请码管理、个人资料等功能已就绪

🎉 4. 完成状态总结
用户中心基础功能已 100%完成，包括：
✅ 个人资料管理（获取+更新）
✅ 密码安全管理  
✅ 邀请码系统完整功能
✅ 完整的前端用户界面
✅ 完善的 API 接口支持

---

🎯 历史完成功能
Feature: 邀请制 + 邮件验证注册系统
Status: ✅ 已完成
Owner: @thinkso-team
Last Updated: 2025-07-24

🎯 1. 目标与价值 (Objective & Value)
将注册流程升级为"邀请码+邮件激活"的双重验证模式，确保新用户的真实性和高质量，建立一个安全、可控的新用户注册流程，让产品达到可以公开发布的"最低标准"。

✅ 2. 验收标准 (Definition of Done)
[x] 数据库模型设计完成 (User.is_verified + InvitationCode 模型)
[x] 邮件服务配置完成 (fastapi-mail + EmailService)
[x] 邀请码管理 API 完成
[x] 后端功能测试通过
[x] 注册 API 支持邀请码和邮件验证
[x] 邮箱验证接口完成
[x] 前端注册页面集成邀请码输入
[x] 邮箱验证页面创建
[x] 注册成功提示页面
[x] 前后端集成测试通过
[x] 生产环境部署和验证

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)
[x] 数据库: User 模型添加 is_verified 字段
[x] 数据库: 创建 InvitationCode 数据模型
[x] 迁移: 生成 Alembic 数据库迁移脚本
[x] 邮件: 配置 fastapi-mail 和 EmailService
[x] 邮件: 实现 JWT 令牌生成和验证
[x] API: 邀请码管理接口 (/api/invitations/\*)
[x] API: 修改注册接口支持邀请码验证
[x] API: 创建邮箱验证接口 (GET /api/auth/verify-email)
[x] 验证: 邀请码有效性检查和使用状态更新
[x] 邮件: 验证邮件和欢迎邮件模板

前端 / UI (Frontend / UI)
[x] 页面: 修改 /register 页面添加邀请码输入框
[x] 页面: 创建 /verify-email 邮箱验证页面
[x] 页面: 创建注册成功提示页面
[x] 组件: 邮件验证状态显示组件
[ ] 状态: AuthContext 添加 isVerified 状态
[x] 交互: 注册流程优化和错误处理
[x] UI: 邀请码输入验证和提示

测试 (Testing)
[x] 后端: 邀请码 API 接口测试
[x] 后端: 邮件服务功能测试
[x] 后端: 注册流程集成测试
[x] 前端: 注册页面组件测试
[x] E2E: 完整邀请注册验证流程测试

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
验证令牌: 选用 JWT 作为邮件验证和密码重置的令牌，因为它无状态、易于集成，并且可以携带过期时间（exp）等元数据。

邮件服务: 生产环境将使用 SendGrid 作为邮件发送提供商，以保证高送达率。fastapi-mail 库能够很好地支持各类 SMTP 服务。

已知取舍与风险 (Known Trade-offs & Risks)
风险: 邮件可能会被误判为垃圾邮件。解决方案是配置好 SPF 和 DKIM 记录，并优化邮件内容。

取舍: 邀请码当前设计为一次性使用，不支持可复用邀请码，以简化初期逻辑。

开发/测试提示 (Dev/Test Tips)
本地邮件测试: 在开发环境中使用 MailHog 捕获所有外发的邮件进行调试，避免真实邮件发送。可在 docker-compose.yml 中配置。

令牌调试: 验证令牌的有效期在开发环境中可设置为较长时间（如 1 小时），方便调试，但在生产环境必须恢复为短时效（如 15 分钟）。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 邀请码使用统计和分析
[ ] 邀请奖励积分系统
[ ] 批量邀请码生成
[ ] 邀请码有效期自定义设置

Feature: 密码重置功能
Status: ✅ 已完成
Owner: @thinkso-team
Last Updated: 2025-07-24

🎯 1. 目标与价值 (Objective & Value)
允许忘记密码的用户通过其已验证的注册邮箱安全地重置密码，提升用户体验和账户安全性。

✅ 2. 验收标准 (Definition of Done)
[x] 密码重置请求 API 完成
[x] 密码重置执行 API 完成
[x] 前端忘记密码页面创建
[x] 前端密码重置页面创建
[x] 邮件模板设计和发送
[x] 安全性验证 (token 时效、一次性使用)
[x] 用户流程测试完成

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)
[x] API: 创建 POST /api/auth/request-password-reset
[x] API: 创建 POST /api/auth/reset-password
[x] 验证: 邮箱验证状态检查 (is_verified = True)
[x] 令牌: 密码重置 token 生成和验证 (15 分钟有效期)
[x] 邮件: 密码重置邮件模板和发送

前端 / UI (Frontend / UI)
[x] 页面: 创建 /forgot-password 页面
[x] 页面: 创建 /reset-password 页面
[x] 表单: 邮箱输入和验证
[x] 表单: 新密码输入和确认
[x] 状态: 重置流程状态管理

测试 (Testing)
[x] 后端: 密码重置 API 测试
[x] 安全: Token 安全性测试
[x] E2E: 完整密码重置流程测试

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
令牌一次性: 密码重置令牌被设计为“一次性有效”。后端会在令牌被成功使用后将其加入“黑名单”（例如，存入 Redis 并设置过期时间），防止重放攻击。

已知取舍与风险 (Known Trade-offs & Risks)
风险: “请求重置密码”的接口可能会被用于恶意探测哪些邮箱已被注册。缓解措施是实施严格的速率限制。

重要依赖 (Key Dependencies)
硬依赖: 此功能必须在用户的邮箱通过验证（is_verified = True）后才能使用，后端逻辑必须强制检查此项。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 增加短信验证码重置密码的选项。
[ ] 记录密码重置历史，用于安全审计。

Feature: 基础安全增强
Status: ✅ 已完成
Owner: @thinkso-team
Last Updated: 2025-07-24

🎯 1. 目标与价值 (Objective & Value)
为注册和登录接口增加基础的防护措施，抵御自动化攻击，提升平台安全性。

✅ 2. 验收标准 (Definition of Done)
[x] 速率限制实施完成
[x] 强密码验证实现
[x] Google reCAPTCHA 集成
[x] 密码强度指示器完成
[x] 安全性测试通过

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)
[x] 安全: 安装配置 slowapi 速率限制库
[x] 限制: 为关键接口添加速率限制 (/login, /register 等)
[x] 验证: 强化密码复杂度服务器端验证
[x] 配置: 速率限制阈值设定和调优

前端 / UI (Frontend / UI)
[x] 安全: 集成 Google reCAPTCHA v3 组件
[x] UI: 密码强度实时指示器
[x] 验证: 前端密码复杂度检查
[x] 配置: reCAPTCHA 环境变量配置

测试 (Testing)
[x] 安全: 速率限制功能测试
[x] 验证: 密码强度验证测试
[x] 集成: reCAPTCHA 集成测试

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
速率限制库: 选用 slowapi，因为它与 FastAPI 框架原生集成良好，支持多种存储后端（内存、Redis）。

人机验证: 选用 reCAPTCHA v3，因为它对用户无感知，体验更好。但会在无法访问 Google 服务的地区失效。

已知取舍与风险 (Known Trade-offs & Risks)
风险: 速率限制的阈值需要在生产环境根据实际流量进行调优。初期设置过于严格可能会影响正常用户。

开发/测试提示 (Dev/Test Tips)
环境禁用: 在 .env 文件中设置开关，允许在 test 和 development 环境中禁用速率限制和 reCAPTCHA，以便于自动化测试和开发调试。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 引入 Web Application Firewall (WAF) - 云端防护
[ ] 登录失败锁定机制 - 账户级别锁定
[ ] 更细粒度的速率限制策略（按用户、按 IP 分层限制）
[ ] 异常行为检测和自动封禁
[ ] 分布式环境下的速率限制（Redis 后端）

📊 6. 当前安全状态评估 (Current Security Status)
✅ 已实现的安全功能:

- 基础速率限制: 登录/注册/密码重置 (10 次/分钟)
- JWT 认证令牌系统
- 密码强度验证
- 邮箱验证机制
- 邀请码准入控制
- reCAPTCHA 人机验证支持
- 密码哈希存储(bcrypt)
- CORS 跨域保护
- 输入验证和 SQL 注入防护

🔶 部分实现/需改进:

- 速率限制目前基于内存，大规模部署需 Redis 后端
- 登录失败未实现账户级锁定(目前仅 IP 级限制)
- 未部署 WAF，依赖云平台基础防护

🔴 未实现的高级安全功能:

- 账户级别的登录失败锁定
- 异常行为模式检测
- Web 应用防火墙(WAF)集成
- 分布式速率限制
- 安全事件日志和监控

Feature: 管理员后台基础
Status: ✅ 已完成
Owner: @thinkso-team
Last Updated: 2025-07-24

🎯 1. 目标与价值 (Objective & Value)
创建只有管理员能访问的管理后台，用于监控应用核心状态、管理用户、生成初始邀请码，为产品运营和用户支持提供必要工具。

✅ 2. 验收标准 (Definition of Done)
[x] 超级管理员权限模型完成
[x] 管理员认证中间件实现
[x] 统计和用户管理 API 接口完成
[x] 前端管理员路由保护
[x] 统计仪表盘界面完成并展示核心指标
[x] 用户管理功能（列表、搜索、筛选、操作）实现
[x] 邀请码管理界面完成
[x] 关键管理操作有日志记录

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)
[x] 数据库: User 模型添加 is_superuser 字段
[x] 权限: 创建 get_current_admin 认证依赖（校验 JWT 并确认 is_superuser 为 True）
[x] API: 新建 admin.py 路由文件，并用上述依赖保护
[x] API: 创建 GET /api/admin/stats 统计接口，返回用户总数、今日新增、思维导图总数、已用邀请码数等核心指标
[x] API: GET /api/admin/users 获取用户列表，必须支持分页、按邮箱搜索、按 is_active 和 is_verified 状态筛选
[x] API: PUT /api/admin/users/{id} 更新用户信息（主要用于启用/禁用 is_active 状态）
[x] API: DELETE /api/admin/users/{id} 删除用户（建议软删除）
[x] API: POST /api/admin/invitations 管理员邀请码生成接口
[x] 日志: 为所有执行修改操作的管理员 API（如禁用用户、删除用户）添加基础日志记录

前端 / UI (Frontend / UI)
[x] 状态: AuthContext 添加 is_superuser 字段，并在用户登录后从 /profile 接口获取
[x] 路由: 创建管理员路由守卫，保护所有 /admin/\* 路径
[x] 页面: 创建 /admin/dashboard 统计仪表盘页面
[x] 布局: 采用卡片式布局，作为后台首页
[x] 组件: 开发核心指标卡片，用于展示：
[x] 用户总数
[x] 今日新增用户
[x] 活跃思维导图总数
[x] 已使用邀请码
[x] 页面: 创建 /admin/users 用户管理页面
[x] 组件 (控制区): 在页面顶部创建控制区，包含：
[x] 搜索框: 用于按用户邮箱进行搜索。
[x] 状态筛选器: 下拉菜单或按钮组，用于按"已验证"、"未验证"、"已禁用"等状态筛选用户。
[x] 组件 (数据表格): 开发用户数据表格，包含：
[x] 核心列: 用户 ID, 邮箱, 注册时间, 状态。
[x] 状态列: 使用不同颜色的标签 (Tag/Badge) 清晰展示用户的"已验证"、"未验证"、"已禁用"状态。
[x] 操作列: 为每行数据添加一个包含操作按钮（例如"禁用/启用账户"）的菜单。
[x] 组件 (分页): 在表格下方添加分页控件。
[x] 页面: 创建 /admin/invitations 邀请码管理页面

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
权限模型: 初期采用简单的布尔值 is_superuser 字段进行权限控制，足以满足当前需求。暂不引入复杂的 RBAC（基于角色的访问控制）系统，避免过度设计。
已知取舍与风险 (Known Trade-offs & Risks)
安全: 管理员后台是高权限区域，所有 API 必须强制使用 get_current_admin 依赖进行保护，不能遗漏。
开发/测试提示 (Dev/Test Tips)
创建超级用户: 第一个超级管理员需要通过命令行脚本 (python scripts/create_superuser.py) 或手动连接数据库进行创建。
操作日志: 初期日志直接输出到 Render 服务日志即可 (logging.info(...))，方便查看且无需额外配置，完美符合简单风格。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 更细粒度的权限控制（RBAC）。
[ ] 完整的管理员操作日志审计界面。
[ ] /admin/users/[id] 用户详情页，展示更丰富的用户信息（如思维导图列表、积分明细等）。

Feature: 用户中心基础
Status: ✅ 已完成
Owner: @thinkso-team
Last Updated: 2025-07-26

🎯 1. 目标与价值 (Objective & Value)
为普通注册用户提供一个统一的、自服务的管理中心，用于管理个人资料、账户安全、查看用量、生成邀请码以及个性化应用设置，提升用户的掌控感与产品粘性。

✅ 2. 验收标准 (Definition of Done)
[x] 导航栏快捷入口升级完成，可显示积分并访问新页面
[x] 统一的 /settings 页面和侧边栏导航布局完成
[x] 个人资料管理功能（修改名称/头像）实现
[x] 密码修改功能实现
[x] 用量与积分查看功能完成
[x] 用户邀请码生成与管理功能实现

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)

[x] API: 创建 PUT /api/auth/profile 接口，用于用户更新自己的显示名称和头像。
[x] API: 创建 PUT /api/auth/password 接口，用于用户修改密码（需要验证当前密码）。
[x] API: 增强 GET /api/auth/profile 接口，使其能返回积分、邀请名额等更多用户信息。
[x] API: 创建 GET /api/invitations/list 接口，用于获取用户已生成的邀请码和剩余名额。
[x] API: 创建 POST /api/invitations/create 接口，供用户生成自己的邀请码（需包含次数限制逻辑）。
[x] API: 创建 GET /api/invitations/stats 接口，用于获取邀请码统计信息。

前端 / UI (Frontend / UI)

[x] 导航: 升级 Header 组件，实现包含积分显示的快捷入口下拉菜单。
[x] 布局: 创建 /settings 统一页面，采用左侧导航 + 右侧内容的两栏布局。
[x] 路由: /settings 页面需要路由守卫保护，仅登录用户可访问。
[x] 页面: 开发"个人资料"设置页 (/settings/profile)，允许用户修改显示名称和头像。
[x] 页面: 开发"账户与安全"设置页 (/settings/security)，提供修改密码的表单。
[x] 页面: 开发"用量与计费"设置页 (/settings/billing)，展示当前积分和（初期的）用量信息。
[x] 页面: 开发"邀请好友"页面 (/settings/invitations)，展示邀请码、剩余名额和生成按钮。

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
导航模式: 采用“快捷入口 + 统一设置中心”的设计模式，兼顾了便捷性和功能的完整性。
UI 布局: /settings 页面采用经典的侧边栏导航布局，便于未来扩展更多设置项。
已知取舍与风险 (Known Trade-offs & Risks)
功能克制: 初期为保持简单，暂不实现“修改邮箱”功能，因为它涉及复杂的二次验证流程，优先级较低。
安全: 修改密码等敏感操作的 API，必须强制要求用户重新提交当前密码进行验证。
开发/测试提示 (Dev/Test Tips)
组件化: /settings 页面中的每个子页面（个人资料、安全等）都应开发为独立的组件，由右侧内容区动态加载。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 修改邮箱功能（需二次验证）。
[ ] 更详细的用量历史记录。
[ ] 应用设置（如深色/浅色模式切换）。
[ ] MFA/2FA 安全设置。
[ ] 账户删除功能。

Feature: 积分系统
Status: 规划中
Owner: @thinkso-team
Last Updated: 2025-07-24

🎯 1. 目标与价值 (Objective & Value)
为用户引入积分概念，用于计量服务使用量，控制成本并为商业化做铺垫，实现一个对用户透明、公平且可持续的商业模式。

✅ 2. 验收标准 (Definition of Done)
[ ] 用户积分模型及积分明细模型完成
[ ] 积分扣除逻辑实现，并记录明细
[ ] 前端操作前有成本预估
[ ] 前端积分显示及明细列表完成
[ ] 积分不足处理机制，并引导至积分获取途径
[ ] 积分安全性验证

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)

[ ] 数据库: User 模型添加 credits 字段
[ ] 数据库: 创建 CreditTransaction 数据模型，用于记录积分明细
[ ] 逻辑: 在 AI 调用核心服务中，实现积分检查与扣除机制，并在 CreditTransaction 表中创建记录
[ ] 安全: 确保积分操作的原子性（例如使用事务锁）
[ ] 配置: 为新注册用户设置初始积分
[ ] API: 创建 GET /api/me/credits/history 接口，返回当前用户的积分明细列表
前端 / UI (Frontend / UI)
[ ] 状态: AuthContext 添加 credits 字段
[ ] UI: 在导航栏和用户中心显眼位置，显示用户剩余积分
[ ] UI: 在创建页面，根据用户输入的内容（文本长度、音视频时长），实时计算并显示本次操作预计消耗的积分
[ ] UI: 在用户中心的“用量与计费”页面，增加一个积分明细列表，调用新 API 展示数据
[ ] 提示: 当用户积分不足时，显示友好提示，并提供一个指向“邀请好友”页面的链接
测试 (Testing)
[ ] 功能: 积分扣除逻辑和明细记录测试
[ ] 安全: 并发操作安全测试
[ ] UI: 积分显示、成本预估和明细列表功能测试

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
原子性操作: 所有修改用户积分的操作必须是原子性的，并同步创建一条明细记录，以防止并发请求导致的数据不一致问题。在数据库层面，将使用 SELECT ... FOR UPDATE 事务锁来实现。
成本预估: 成本预估在前端进行，以便实时反馈，而后端在执行操作时必须进行独立的、最终的成本计算和验证。
已知取舍与风险 (Known Trade-offs & Risks)
风险: 积分计算或扣除逻辑出现 bug 可能导致用户资产损失，引发用户不满。所有相关代码必须有严格的测试覆盖。
取舍: 初期积分为整数，不支持小数，以简化计算。积分明细初期只记录核心信息，暂不提供复杂的筛选和统计。
重要依赖 (Key Dependencies)
AI 服务: 积分扣除逻辑与核心的 AI 生成服务强耦合，必须在调用 AI 服务前后进行积分检查和扣除。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 积分充值功能：允许用户直接购买积分（对接支付网关）。
[ ] 订阅套餐：提供每月/每年订阅，包含固定的积分额度（例如，每月积分重置）。
[ ] 每日签到/活跃奖励：通过每日登录等行为给予少量积分，提升用户活跃度。
[ ] 积分有效期：为赠送的积分设置过期时间，鼓励用户及时使用。

Feature: 计费系统 (MVP - Stripe 集成)
Status: 规划中
Owner: @thinkso-team
Last Updated: 2025-07-24

🎯 1. 目标与价值 (Objective & Value)
集成 Stripe 支付网关，为用户提供一个安全、专业、全球通用的支付流程，实现积分充值功能。这是 ThinkSo 走向商业化、实现可持续运营的“最后一公里”。

✅ 2. 验收标准 (Definition of Done)
[ ] Stripe 账户（通过 Stripe Atlas）成功注册并激活。
[ ] 后端成功集成 Stripe SDK。
[ ] 创建支付会话的 API 接口完成。
[ ] 处理支付成功回调的 Webhook 接口完成。
[ ] 前端有清晰的积分购买选项和支付入口。
[ ] 用户可以成功跳转到 Stripe Checkout 页面并完成支付。
[ ] 支付成功后，用户的积分余额能自动、准确地增加。
[ ] 整个支付和积分到账流程经过沙箱环境和生产环境验证。

📋 3. 任务分解 (Task Breakdown)
前期准备 (Pre-development)

[ ] 账户: 完成 Stripe Atlas 的申请流程，获取公司实体、银行账户和已激活的 Stripe 账户。
[ ] 配置: 在 Stripe Dashboard 中，获取 API 密钥（Publishable Key 和 Secret Key）以及 Webhook 签名密钥，并将它们添加到项目后端的环境变量中。
[ ] 商品定义 (新增): 在 Stripe Dashboard 的“产品目录 (Product catalog)”中，创建好我们的积分包商品和对应的价格方案，并记录下每个价格的唯一 Price ID。
后端 / API (Backend / API)
[ ] 依赖: 将 stripe Python 库添加到 requirements.txt。
[ ] API: 创建一个新的接口 POST /api/payments/create-checkout-session，负责：
[ ] 接收前端传来的 Price ID。
[ ] 使用 Stripe SDK 创建一个 Stripe Checkout Session。
[ ] 在 Session 中定义好商品信息（通过 Price ID）。
[ ] 设置支付成功和取消后的跳转 URL。
[ ] 将创建好的 Session ID 或 URL 返回给前端。
[ ] Webhook: 创建一个公开的 Webhook 接口 POST /api/webhooks/stripe，负责：
[ ] 接收来自 Stripe 服务器的异步通知（例如 checkout.session.completed 事件）。
[ ] 必须验证 Webhook 请求的签名，确保请求确实来自 Stripe，防止伪造。
[ ] 解析事件内容，获取用户信息和购买的商品信息。
[ ] 安全地为对应用户的 credits 字段增加积分，并同步创建一条积分增加的明细记录。
前端 / UI (Frontend / UI)
[ ] UI: 在用户中心的“用量与计费”页面 (/settings/billing)，创建一个“购买积分”区域。
[ ] 组件: 设计商品卡片，清晰地展示不同的积分包及其价格（例如，“10,000 积分 - $7.00”）。
[ ] API 调用: 当用户点击“购买”按钮时，调用后端的 /create-checkout-session 接口。
[ ] 跳转: 获取到后端返回的 Stripe Checkout URL 后，将页面重定向到该 URL，用户将在 Stripe 托管的安全页面上完成支付。
[ ] 结果页面: 创建 /payment/success 和 /payment/cancel 两个页面，用于接收从 Stripe 跳转回来的用户，并向他们显示支付成功或取消的提示。

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
支付 UI: MVP 阶段选用 Stripe Checkout 方案。这是由 Stripe 托管的完整支付页面，能最大程度地降低我们的开发工作量和安全合规负担。
Webhook 安全: 必须强制验证所有接收到的 Stripe Webhook 事件的签名。这是确保只有合法支付才能触发积分增加的关键安全措施。
幂等性: 后端 Webhook 处理器需要具备幂等性，即使用户意外地或 Stripe 重复发送了同一个成功事件，用户的积分也只能被增加一次。
已知取舍与风险 (Known Trade-offs & Risks)
外部依赖: 整个计费系统强依赖于 Stripe 服务的可用性。
合规性: 注册 Stripe Atlas 账户后，你的美国公司将需要履行相应的年度报告和税务申报义务，需要聘请专业会计师处理。
开发/测试提示 (Dev/Test Tips)
测试模式: Stripe 提供了非常完善的测试模式 (Test Mode)。开发和测试阶段，应全程使用测试 API 密钥和 Stripe 提供的虚拟信用卡号进行，无需真实扣费。

🚀 5. 未来范围 / V2 (Future Scope / V2)

[ ] 订阅套餐：实现按月/按年订阅，自动续费和积分重置。
[ ] 退款处理：在管理员后台增加处理用户退款申请的功能，通过 API 调用 Stripe 进行退款操作。
[ ] 发票管理：允许用户在用户中心查看和下载他们的支付发票。
[ ] 支持更多支付方式：通过 Stripe 后台，轻松开启对 Apple Pay, Google Pay 等更多支付选项的支持。
[ ] 支持加密货币支付：集成 Coinbase Commerce 等加密货币支付网关，作为 Stripe 之外的补充支付选项。

Feature: YouTube 视频转换 (MVP)
Status: 规划中
Owner: @thinkso-team
Last Updated: 2025-07-29

🎯 1. 目标与价值 (Objective & Value)
将 ThinkSo 的内容处理能力从纯文本扩展到多媒体领域，允许用户通过粘贴 YouTube 视频链接，快速将其内容结构化为思维导图。这将极大地拓宽产品的应用场景和用户群体，吸引学生、研究员和内容创作者等新用户。

✅ 2. 验收标准 (Definition of Done)
[ ] 后端能够成功从 YouTube 链接提取字幕文本。
[ ] 视频处理的 API 接口开发完成，并与积分系统集成。
[ ] 前端提供输入 YouTube 链接的 UI 界面。
[ ] 前端在处理过程中，能向用户展示清晰、分步骤的进度反馈。
[ ] 从一个有字幕的视频链接，可以成功生成并渲染出思维导图，且内容中不包含“发言人 X”等无用信息。
[ ] 对于没有字幕的视频，系统能够捕获并向用户返回友好的错误提示。
[ ] 整个功能在生产环境中经过验证，稳定可用。

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)

[ ] 依赖: 将 youtube-transcript-api 库添加到 requirements.txt。
[ ] API: 创建一个新的接口 POST /api/process-video，接收一个包含 video_url 的请求。
[ ] 服务: 创建一个 VideoProcessor 服务，负责以下逻辑：
[ ] 使用 youtube-transcript-api 提取指定视频的字幕文本。
[ ] 处理提取失败（如视频不存在、无字幕）的异常情况。
[ ] AI 集成: 将获取到的字幕文本传递给我们现有的 ai_processor 进行分析和结构化。在发送给 Gemini 的 Prompt 中，必须增加一条明确的指令，要求模型在分析和总结内容时，忽略“发言人 X”、“[音乐]”等说话者标签和元数据，只关注对话的实质内容。
[ ] 积分系统: 在 /api/process-video 接口中，集成积分检查与扣除逻辑。计费标准可按视频时长设定（例如 每分钟消耗 100 积分），需要在调用 AI 前检查积分是否充足。

前端 / UI (Frontend / UI)

[ ] UI 切换: 在创建页面 (/create)，添加一个模式切换的选项卡或按钮，允许用户在“文本/文件上传”和“YouTube 链接”之间切换。
[ ] 组件: 开发一个新的输入组件，专门用于粘贴和验证 YouTube 视频链接。
[ ] 组件: 在输入组件中，集成清晰的用户引导文案，明确告知 MVP 阶段的功能限制和要求。具体文案如下：
标题: 输入公开的 YouTube 视频链接
占位提示: 粘贴一个 YouTube 视频链接，例如: https://www.youtube.com/watch?v=...
详细说明:
✅ 当前版本支持：带有官方字幕或自动生成字幕的公开 YouTube 视频。
❌ 暂不支持：完全没有字幕、需要登录或付费才能观看的私密视频。
💡 提示：字幕质量将直接影响思维导图的效果，建议优先选择带有人工校对字幕的视频。
[ ] 进度反馈: 开发一个分步进度指示器。由于视频处理时间较长，不能只有一个简单的加载动画。需要明确提示当前状态，例如：
(1/3) 正在提取视频字幕...
(2/3) AI 正在深度分析内容...
(3/3) 正在生成思维导图...
[ ] API 调用: 实现调用后端 POST /api/process-video 接口的逻辑。
[ ] 错误处理: 在前端清晰地处理并展示后端可能返回的各种错误（如链接无效、无字幕、积分不足等）。

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)

字幕提取库: 选用 youtube-transcript-api，因为它功能强大、社区活跃且易于使用。
MVP 范围: 初期只支持有可用字幕的视频，暂不集成语音转文字 (STT) 服务，以控制开发成本和 API 费用。
内容优化 (新增): 采用提示工程 (Prompt Engineering) 的方式解决字幕文本中的“发言人”标签和元数据噪音问题。这是一种成本最低、改动最小且效果显著的优化方法。
积分模型: 视频处理将采用独立的积分消耗模型（按时长计费），与文本处理区分开，以更准确地反映成本。
已知取舍与风险 (Known Trade-offs & Risks)
处理时长: 长视频（例如超过 30 分钟）的处理时间可能会很长，对用户体验是考验。清晰的进度反馈是缓解此问题的关键。
字幕质量: 依赖 YouTube 自动生成的字幕质量可能参参差不齐，这会直接影响最终生成的思维导图的质量。这是当前 MVP 阶段接受的技术限制。
开发/测试提示 (Dev/Test Tips)
测试用例: 准备一组不同情况的 YouTube 视频链接用于测试：短视频、长视频、多语言字幕视频、只有自动字幕的视频、无字幕视频、无效链接等。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 集成语音转文字 (STT): 对于无字幕视频，调用 OpenAI Whisper 或 Google STT 服务生成文本。
[ ] 异步处理与通知: 对于超长视频，采用异步任务处理，完成后通过邮件或站内信通知用户。
[ ] 关联时间戳: 实现思维导图节点与视频播放时间戳的关联，点击节点可跳转播放。
[ ] 支持更多视频平台: 如 Vimeo, Bilibili 等。

Feature: 音频文件转换 (MVP)
Status: 规划中
Owner: @thinkso-team
Last Updated: 2025-07-24

🎯 1. 目标与价值 (Objective & Value)
将 ThinkSo 的能力圈扩展至音频领域，允许用户上传音频文件（如会议录音、课程、采访、播客），并由 AI 自动转录和提炼，生成结构化的思维导图。这将服务于学生、记者、商务人士等“信息创造者”和“记录者”群体，极大增强产品的核心价值和应用深度。

✅ 2. 验收标准 (Definition of Done)
[ ] 后端能够接收并临时存储用户上传的音频文件。
[ ] 后端成功集成 OpenAI Whisper API，可将音频转录为文本。
[ ] 音频处理的 API 接口开发完成，并与积分系统正确集成。
[ ] 前端提供音频文件上传（点击/拖拽）的 UI 界面。
[ ] 前端在处理过程中，能向用户展示清晰、分步骤的进度反馈。
[ ] 从一个受支持的音频文件，可以成功生成并渲染出思维导图。
[ ] 对超出大小/时长限制或格式不支持的文件，系统能返回友好的错误提示。
[ ] 整个功能在生产环境中经过验证，稳定可用。

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)

[ ] 依赖: 将 openai 库添加到 requirements.txt。
[ ] API: 创建一个新的接口 POST /api/process-audio，用于接收用户上传的音频文件。
[ ] 服务: 创建一个 AudioProcessor 服务，负责以下逻辑：
[ ] 安全地处理文件上传，将音频临时保存到服务器磁盘。
[ ] 调用 OpenAI Whisper API (whisper-1 模型) 对音频文件进行转录，自动检测语言。
[ ] 处理转录过程中可能发生的 API 错误。
[ ] 操作完成后必须删除服务器上的临时音频文件。
[ ] AI 集成: 将 Whisper 返回的转录文本，传递给我们现有的 ai_processor (Gemini) 进行分析和结构化。需要优化 Prompt 以适应会议、采访等口语化文本。
[ ] 积分系统: 在 /api/process-audio 接口中，集成积分检查与扣除逻辑。计费标准按音频时长设定（例如 每分钟消耗 500 积分），需要在调用 STT 服务前检查积分是否充足。
前端 / UI (Frontend / UI)
[ ] UI 切换: 在创建页面 (/create)，添加“音频文件”的上传模式。
[ ] 组件: 增强现有的 FileUpload 组件，或创建一个新的组件，以支持音频文件的上传，并严格限制文件大小和格式（例如，最大 25MB，支持 mp3, m4a, wav）。
[ ] 组件: 在上传组件中，集成清晰的用户引导文案，明确告知功能限制和要求。具体文案如下：

标题: 上传音频文件
上传框提示: 点击选择文件，或将文件拖拽到此处 (支持 MP3, M4A, WAV 格式)
详细说明:
✅ 支持格式：MP3, M4A, WAV。
🔒 上传限制：文件大小不超过 25MB，音频时长不超过 10 分钟。
💡 为获得最佳效果：请上传人声清晰、背景噪音较少的音频。
💰 积分消耗：音频处理将按时长消耗积分（例如，每分钟 500 积分），请确保积分充足。

[ ] 进度反馈: 开发一个分步进度指示器，向用户清晰地展示后台耗时较长的处理步骤：
(1/4) 正在上传音频文件...
(2/4) AI 正在进行语音转文字... (此过程可能需要几分钟)
(3/4) AI 正在深度分析文本内容...
(4/4) 正在生成思维导图...
[ ] API 调用: 实现调用后端 POST /api/process-audio 接口的逻辑，需要能处理二进制文件的 multipart/form-data 上传。
[ ] 错误处理: 在前端清晰地处理并展示后端可能返回的各种错误（如文件过大、格式不支持、积分不足、转录失败等）。

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)
技术决策 (Technical Decisions)
STT 引擎: MVP 阶段选用 OpenAI Whisper API，因为它能自动检测语言，对中英文及各种真实噪音场景识别效果出色，且 API 集成简单。
文件存储: MVP 阶段采用服务器磁盘临时存储的方案，以快速实现功能。上传的文件在处理完毕后必须立即删除。
功能限制: 为控制成本和处理时长，初期设定严格的上传限制，例如最大文件大小 25MB，最长音频时长 10 分钟。
积分模型: 音频处理将采用独立的、按分钟计费的积分消耗模型，以精确覆盖 STT API 的成本。
已知取舍与风险 (Known Trade-offs & Risks)
处理时长与架构: 即便有 10 分钟的限制，同步 HTTP 请求仍可能因网络波动而超时。这是 MVP 阶段接受的风险，长期解决方案是引入异步任务队列。
成本控制: STT 服务成本较高，积分定价必须仔细核算，确保商业模式可持续。
转录准确性: 音频质量（如噪音、口音）将直接影响转录文本的准确性，进而影响最终思维导图的质量。
开发/测试提示 (Dev/Test Tips)
测试用例: 准备多种测试音频文件：中文、英文、中英混合、有背景噪音、不同格式（mp3/m4a/wav）、超出大小/时长限制的文件。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 异步处理与通知: 引入 Celery + Redis 实现异步任务处理，解除文件大小和时长限制，处理完成后通过邮件或站内信通知用户。
[ ] 云存储集成: 将文件上传模式从服务器磁盘改为直传到 Amazon S3 等云存储服务，提升稳定性和扩展性。
[ ] 区分发言人: 探索使用能区分不同发言人的 STT 模型或服务，以生成更精细的会议纪要类思维导图。
[ ] 支持更多音频格式: 引入 ffmpeg 等工具进行格式转换，以支持更广泛的音频格式。

Feature: 播客转换 (MVP via RSS Feed)
Status: 规划中
Owner: @thinkso-team
Last Updated: 2025-07-29

🎯 1. 目标与价值 (Objective & Value)
将 ThinkSo 的内容处理能力从单体音频文件扩展到系列播客节目，允许用户通过提供播客的 RSS Feed 链接，选择任意一集节目并将其内容快速结构化为思维导图。这将精准服务于播客的重度听众、深度学习者和内容创作者，进一步巩固 ThinkSo 作为深度内容分析工具的领先地位。

✅ 2. 验收标准 (Definition of Done)
[ ] 后端能够成功解析一个有效的播客 RSS Feed 链接，并返回节目列表。
[ ] 前端能够清晰地展示从 RSS Feed 解析出的单集节目列表。
[ ] 用户选择某一集后，后端能够获取其音频文件并成功调用 STT 服务。
[ ] 播客处理的流程与积分系统正确集成。
[ ] 从一个播客单集，可以成功生成并渲染出思维导图，且内容中不包含“发言人 X”等无用信息。
[ ] 对于无效的 RSS 链接或解析错误，系统能返回友好的错误提示。
[ ] 整个功能在生产环境中经过验证，稳定可用。

📋 3. 任务分解 (Task Breakdown)
后端 / API (Backend / API)

[ ] 依赖: 将 feedparser 库添加到 requirements.txt。
[ ] API: 创建一个新的接口 POST /api/podcasts/parse-rss，接收一个包含 rss_url 的请求。
[ ] 服务: 创建一个 PodcastProcessor 服务，负责以下逻辑：
[ ] 使用 feedparser 解析传入的 rss_url。
[ ] 从解析结果中提取所有单集（episodes）的列表，包含标题、简介、发布日期和音频文件直链 (enclosure URL)。
[ ] 处理解析失败（如无效链接、非标准格式）的异常情况。
[ ] 将节目列表以 JSON 格式返回给前端。
[ ] API: 创建一个新的接口 POST /api/podcasts/process-episode，接收一个包含 audio_url 的请求，并触发已有的音频处理流程（STT -> Gemini）。
[ ] AI 集成: 将 STT 服务返回的转录文本传递给我们现有的 ai_processor 进行分析和结构化。在发送给 Gemini 的 Prompt 中，必须增加一条明确的指令，要求模型在分析和总结内容时，忽略“发言人 1”、“发言人 2”等说话者标签，只关注对话的实质内容。
[ ] 积分系统: 在 /api/podcasts/process-episode 接口中，集成积分检查与扣除逻辑。计费标准可按音频时长设定。

前端 / UI (Frontend / UI)

[ ] UI 切换: 在创建页面 (/create)，添加“播客 RSS”的输入模式。
[ ] 组件: 开发一个新的输入组件，专门用于粘贴和提交播客的 RSS Feed 链接。
[ ] 组件: 在输入组件中，集成清晰的用户引导文案，明确告知支持的链接类型和查找方法。
[ ] 组件: 开发一个节目列表展示组件。当用户提交 RSS 链接后，调用 /api/podcasts/parse-rss 接口，并将返回的节目列表渲染出来。
[ ] 流程衔接: 列表中每一集都有一个“生成”按钮。点击后，前端将该集的 audio_url 提交给 /api/podcasts/process-episode 接口，并复用已有的音频处理进度反馈组件。
[ ] 错误处理: 在前端清晰地处理并展示因 RSS 链接无效或解析失败导致的错误。

💡 4. 注意事项与技术决策 (Notes & Technical Decisions)

技术决策 (Technical Decisions)
内容获取: MVP 阶段只支持 RSS Feed 链接作为唯一的内容源，因为它技术上最稳定、最可靠，且能精准定位核心用户。
核心库: 选用 feedparser 作为后端 RSS 解析的核心库。
架构复用: 本功能将最大限度地复用已有的“音频文件转换”功能的技术架构，包括 STT 服务 (Whisper)、AI 分析服务 (Gemini) 和积分扣除逻辑。
内容优化: 采用提示工程 (Prompt Engineering) 的方式解决对话文本中的“发言人”标签问题。这是一种成本最低、改动最小且效果显著的优化方法，避免了引入复杂的“区分发言人”技术。
已知取舍与风险 (Known Trade-offs & Risks)
用户体验门槛: 要求用户自行寻找和提供 RSS Feed 链接，对非重度播客用户存在一定门槛。这是为了保证 MVP 阶段技术稳定性的主动取舍。
RSS 格式兼容性: 不同播客平台生成的 RSS Feed 可能存在细微差异，解析逻辑需要有一定的容错性。
开发/测试提示 (Dev/Test Tips)
测试用例: 准备一组来自不同播客平台（如 Apple Podcasts, 小宇宙, Overcast 等）的 RSS Feed 链接进行测试，确保兼容性。

🚀 5. 未来范围 / V2 (Future Scope / V2)
[ ] 解析主流平台分享链接: 开发针对 Apple Podcasts, Spotify, 小宇宙等平台的专用链接解析器，以降低用户使用门槛。
[ ] 播客订阅功能: 允许用户保存自己喜欢的播客 RSS Feed，方便快速访问。
[ ] 关联章节信息 (Chapters): 解析 RSS Feed 中的章节数据，并与思维导图节点进行关联。
[ ] 新单集自动处理: 对用户订阅的播客，在新单集发布后自动生成思维导图并通知用户。
[ ] 智能区分发言人: 引入能识别不同说话者的 STT 模型，将“发言人 1”替换为真实或推测的身份（如“主持人”、“嘉宾 A”）。

📊 项目进度总览
✅ 已完成的核心功能 (v3.2.2-stable)

**基础功能**:
[x] 核心思维导图生成 (AI + Markmap)
[x] 文档上传处理 (多格式支持: PDF/DOCX/TXT/MD/SRT)
[x] 用户认证系统 (JWT + 注册登录)
[x] 个人控制台 (Dashboard + 思维导图管理)
[x] 分享功能 (公开链接 + Token 管理)
[x] 导出功能 (SVG/PNG 高清导出)
[x] 展开折叠交互 (智能节点控制 - 修复折叠深度逻辑)
[x] 云端部署 (Render + PostgreSQL + 自动迁移)

**稳定性改进**:
[x] 思维导图创建认证保护 (仅登录用户可创建 - 修复登录状态检查 bug)
[x] 思维导图保存功能 (修复 Boolean 字段类型错误)
[x] 代码质量优化 (清理 console 调试信息)

**高级功能**:
[x] 邀请制注册系统 (邀请码 + 使用限制)
[x] 邮件验证系统 (注册验证 + 邮件服务)
[x] 密码重置功能 (邮件重置 + 安全验证)
[x] 基础安全增强 (速率限制 + 强密码验证 + reCAPTCHA)
[x] 管理员后台基础 (统计仪表盘 + 用户管理 + 邀请码管理)

📋 计划中的功能 (v3.3.0)
[x] 用户中心基础 (个人资料管理 + 安全设置) - ✅ v3.2.2 已完成
[ ] 积分系统 (用量计量 + 成本控制)
[ ] 用户邀请返利 (积分奖励机制)
[ ] 计费系统 (Stripe 集成 + 积分充值)

🚀 内容扩展功能 (v3.4.0+)
[ ] YouTube 视频转换 (字幕提取 + AI 分析)
[ ] 音频文件转换 (STT + 思维导图生成)
[ ] 播客转换 (RSS Feed + 单集处理)

🎨 用户体验增强 (v4.0.0+)
[ ] 思维导图编辑功能 (节点编辑 + 结构调整)
[ ] 多种主题和样式 (颜色方案 + 布局选项)
[ ] 高级导出功能 (PDF + 高分辨率 + 批量导出)
[ ] 协作功能 (实时编辑 + 评论系统)

更新说明: 请在完成任务后将对应的 [ ] 修改为 [x]，这样 AI 就能了解项目的最新进展状态。
