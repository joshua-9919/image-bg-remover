# Image BG Remover 🎨

在线图片背景移除工具 - 3 秒完成抠图，免费无需注册

## ✨ 特性

- ⚡ **快速处理** - AI 智能识别，3 秒完成
- 🔒 **隐私保护** - 图片不落盘，处理完即删除
- 🆓 **免费使用** - 无需注册，完全免费
- 📱 **响应式设计** - 支持桌面和移动端

## 🚀 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 Remove.bg API Key：

```env
REMOVE_BG_API_KEY=your_api_key_here
```

> 获取 API Key: https://www.remove.bg/api

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📦 部署到 Cloudflare Pages

### 方式一：Git 部署（推荐）

1. 将代码推送到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 Pages → Create a project
4. 连接 GitHub 仓库
5. 构建设置：
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next`
6. 添加环境变量 `REMOVE_BG_API_KEY`
7. 点击 Deploy

### 方式二：Wrangler CLI 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
npm run build
wrangler pages deploy .next --project-name=image-bg-remover
```

## 📁 项目结构

```
image-bg-remover/
├── app/
│   ├── api/
│   │   └── remove/
│   │       └── route.ts      # API 路由（调用 Remove.bg）
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面
├── docs/
│   └── MVP-requirements.md   # 需求文档
├── .env.example              # 环境变量示例
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── wrangler.toml             # Cloudflare 配置
```

## 🔑 API 说明

### Remove.bg 免费额度

- **免费计划**: 50 张/月（标准分辨率）
- **付费计划**: $0.2/张（高清）

### 速率限制

- 单 IP 每分钟最多 10 次请求
- 防止滥用和 DDoS 攻击

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **部署**: Cloudflare Pages
- **API**: Remove.bg

## 📝 许可证

MIT

---

Made with ❤️ by 周建华
