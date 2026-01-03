# Cloudflare Mailbox

Cloudflare Worker + Email Routing 的智能邮件收件箱。支持规则/AI 分类、分类管理、管道编排与前端 SPA。

## 功能概览

- 邮件接收：Cloudflare Email Routing
- 智能分类：收件人/正则/关键词/AI
- 分类管理：支持层级分类
- 管道编辑：拖拽排序、节点配置
- 邮件浏览：列表 + 详情，只读
- 认证：单用户密码 + JWT

## 技术栈

- Worker: Hono + postal-mime + jose
- 存储: D1 + KV
- 前端: Vue 3 + Vite + Naive UI + Pinia

## 项目结构

```
cloudflare-mailbox/
├── src/                  # Worker 代码
├── frontend/             # 前端 SPA
├── schema.sql            # D1 结构参考
├── wrangler.toml         # Cloudflare 配置
└── README.md
```

## 部署

1) 安装依赖

```
npm install
cd frontend && npm install
```

2) 构建前端

```
cd frontend && npm run build
```

3) 部署 Worker

```
wrangler deploy
```

4) Cloudflare 控制台配置 Email Routing

- 绑定域名
- 规则指向此 Worker
- `wrangler.toml` 中 `emails` 改为你的域名

> 数据库会在首次访问 `/api/*` 或收到邮件时自动初始化。

## 开发

- 本地开发：`wrangler dev --local`
- 接口前缀：`/api/*`

## 注意

- `wrangler.toml` 里的 D1/KV ID 需要填你的资源 ID
- AI 分类需要在设置页配置 API

