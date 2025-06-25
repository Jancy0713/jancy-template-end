# Express.js Backend Template (TypeScript)

一个专为前端工程师设计的Express.js + TypeScript后端模板项目，包含了现代化的项目结构和常用功能。

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- TypeScript >= 4.5.0 (已包含在开发依赖中)

### 安装依赖
```bash
npm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 文件中的配置

### 启动项目
```bash
# 开发模式（TypeScript热重载）
npm run dev

# 直接运行TypeScript（无热重载）
npm run dev:ts

# 构建项目
npm run build

# 生产模式（需要先构建）
npm run build && npm start

# 类型检查
npm run type-check
```

服务器将启动并支持以下访问方式：
- **本地访问**: http://localhost:3000
- **局域网访问**: http://192.168.50.79:3000 (根据你的实际IP调整)

## 📁 项目结构

```
jancy-template-end/
├── src/
│   ├── app.ts              # 主应用文件
│   ├── types/              # TypeScript类型定义
│   │   └── index.ts        # 通用类型定义
│   ├── routes/             # 路由目录
│   │   ├── index.ts        # 路由入口
│   │   ├── users.ts        # 用户相关路由
│   │   └── auth.ts         # 认证相关路由
│   ├── config/             # 配置文件目录
│   │   └── swagger.ts      # Swagger配置
│   ├── controllers/        # 控制器目录（预留）
│   └── middleware/         # 中间件目录（预留）
├── dist/                   # 编译输出目录
├── .env                    # 环境变量（不提交到git）
├── .env.example            # 环境变量示例
├── tsconfig.json           # TypeScript配置
├── nodemon.json            # Nodemon配置
├── .gitignore              # Git忽略文件
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 🔧 主要功能

### 已集成的技术栈
- **TypeScript** - 类型安全的JavaScript超集
- **Express** - Web框架
- **CORS** - 跨域资源共享
- **Helmet** - 安全头部设置
- **Morgan** - HTTP请求日志
- **dotenv** - 环境变量管理
- **Swagger UI** - API文档生成和展示 (OpenAPI 3.1.0)
- **ts-node** - TypeScript直接执行
- **nodemon** - 开发时热重载

### API端点

#### 基础端点
- `GET /` - 欢迎页面
- `GET /health` - 健康检查
- `GET /api-docs` - API文档 (Swagger UI)

#### 用户管理 (`/api/users`)
- `GET /api/users` - 获取所有用户
- `GET /api/users/:id` - 获取单个用户
- `POST /api/users` - 创建新用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

#### 认证相关 (`/api/auth`)
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取用户信息（需要token）

## 📚 API文档

项目集成了Swagger UI，提供交互式API文档：

- **本地访问**: http://localhost:3000/api-docs
- **局域网访问**: http://192.168.50.79:3000/api-docs
- **OpenAPI版本**: 3.1.0
- **功能特性**:
  - 交互式API测试
  - 完整的请求/响应示例
  - 参数验证说明
  - 认证方式说明

在Swagger UI中，你可以：
1. 查看所有API端点的详细信息
2. 直接在浏览器中测试API
3. 查看请求和响应的数据结构
4. 了解每个参数的含义和要求

## 📝 API使用示例

### 获取所有用户
```bash
curl http://localhost:3000/api/users
```

### 创建新用户
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","age":28}'
```

### 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🌐 局域网访问

项目已配置支持局域网访问，其他设备可以通过局域网IP访问你的API服务：

### 访问地址
- **本地访问**: http://localhost:3000
- **局域网访问**: http://192.168.50.79:3000
- **API文档**: http://192.168.50.79:3000/api-docs

### 如何获取你的局域网IP
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

### 配置说明
1. 服务器监听所有网络接口 (`0.0.0.0`)
2. CORS已配置允许局域网访问
3. Swagger文档支持多服务器切换
4. 环境变量支持自定义IP配置

### 使用场景
- 移动设备测试API
- 团队协作开发
- 局域网内其他设备访问
- 前端项目联调测试

### 📝 注意事项

1. **防火墙**：确保你的防火墙允许3000端口的入站连接
2. **网络环境**：确保设备在同一局域网内
3. **IP变化**：如果你的IP地址发生变化，需要更新 `.env` 文件中的 `LOCAL_IP` 和 `API_URL`
4. **Swagger UI**：项目已针对局域网访问优化了Content Security Policy，确保Swagger UI能正常加载

### 🔧 故障排除

如果通过局域网IP访问Swagger UI时遇到资源加载问题：

1. **检查浏览器控制台**：查看是否有CSP或CORS错误
2. **清除浏览器缓存**：强制刷新页面 (Ctrl+F5 或 Cmd+Shift+R)
3. **检查网络连接**：确保局域网连接稳定
4. **验证IP地址**：确认使用的IP地址是正确的局域网地址

## 🛠️ 开发指南

### 添加新路由
1. 在 `src/routes/` 目录下创建新的路由文件
2. 在 `src/routes/index.js` 中导入并注册新路由

### 环境变量
项目支持以下环境变量：
- `PORT` - 服务器端口（默认：3000）
- `NODE_ENV` - 运行环境（development/production）
- `CORS_ORIGIN` - CORS允许的源地址
- `LOCAL_IP` - 本机局域网IP地址
- `API_URL` - API服务器地址（用于Swagger文档）

### 错误处理
项目包含全局错误处理中间件，会自动捕获和处理未处理的错误。

## 🔒 安全特性

- 使用 Helmet 设置安全HTTP头部
- CORS 配置防止跨域攻击
- 请求体大小限制（10MB）
- 全局错误处理

## 📦 扩展建议

### 数据库集成
推荐使用以下数据库方案：
- **MongoDB** + Mongoose
- **PostgreSQL** + Sequelize
- **Supabase** (推荐给前端工程师)

### 认证增强
- 集成 JWT 进行真实的身份验证
- 添加密码加密（bcrypt）
- 实现刷新token机制

### 其他功能
- 添加输入验证（joi/express-validator）
- 集成文件上传功能
- ✅ **已完成** - API文档（Swagger UI + OpenAPI 3.1.0）
- 集成测试框架（Jest）
- 添加API版本控制
- 集成日志系统（Winston）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License
