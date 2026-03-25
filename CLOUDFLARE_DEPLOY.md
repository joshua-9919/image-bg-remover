# Cloudflare Pages 部署配置指南

## ✅ 已完成

- [x] Cloudflare Pages 项目创建
  - 项目名：`image-bg-remover`
  - 生产分支：`main`
  - 预览域名：`image-bg-remover-83q.pages.dev`

## 📋 手动配置步骤

### 1. 连接 GitHub 仓库

1. 访问 https://dash.cloudflare.com/
2. 登录你的 Cloudflare 账号
3. 进入 **Workers & Pages** → **image-bg-remover**
4. 点击 **Connect to Git**
5. 授权 Cloudflare 访问 GitHub（如果还没授权）
6. 选择仓库：`joshua-9919/image-bg-remover`
7. 点击 **Begin setup**

### 2. 配置构建设置

```
Project name: image-bg-remover
Production branch: main
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: (留空)
```

### 3. 添加环境变量

点击 **Advanced** → **Add variable**：

| 变量名 | 值 |
|--------|-----|
| `REMOVE_BG_API_KEY` | `PcjUokjmmGsEkmTfwwDSMqNh` |

### 4. 保存并部署

点击 **Save and Deploy**

---

## 🔧 自动部署配置

### 创建 cloudflare.toml 配置文件

```toml
name = "image-bg-remover"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
REMOVE_BG_API_KEY = "PcjUokjmmGsEkmTfwwDSMqNh"

[[pages_build_config]]
build_command = "npm run build"
output_directory = ".next"
```

### 部署命令

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 手动触发部署
wrangler pages deploy .next --project-name=image-bg-remover
```

---

## 📊 项目信息

- **Account ID:** `2989aa3dbcada0c1923fb3a13d48b897`
- **Project Name:** `image-bg-remover`
- **Production Branch:** `main`
- **Preview Domain:** `image-bg-remover-83q.pages.dev`
- **Production Domain:** `image-bg-remover.pages.dev` (部署后)

---

## ⚠️ 注意事项

1. **Node.js 兼容性**
   - Cloudflare Pages 需要启用 Node.js 兼容模式
   - 在 Dashboard → Settings → Functions → Node.js compatibility 开启

2. **构建超时**
   - Next.js 构建可能超时，建议在 `next.config.mjs` 中配置：
   ```javascript
   export const config = {
     runtime: 'experimental-edge',
   }
   ```

3. **环境变量**
   - 生产环境和预览环境需要分别配置
   - 确保 `REMOVE_BG_API_KEY` 已正确设置

---

*创建时间：2026-03-25*
