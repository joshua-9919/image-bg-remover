# Cloudflare Pages GitHub 集成配置指南

## ✅ 已完成

- [x] Cloudflare Pages 项目创建
- [x] 部署脚本准备
- [x] 配置文件就绪

## 🔧 完成 GitHub 集成（必须手动操作）

由于 Cloudflare Pages 的 GitHub 集成需要 OAuth 授权，请按以下步骤操作：

### 步骤 1：登录 Cloudflare Dashboard

访问：https://dash.cloudflare.com/

### 步骤 2：进入 Pages 项目

1. 左侧菜单：**Workers & Pages**
2. 找到项目：`image-bg-remover`
3. 点击进入项目

### 步骤 3：连接 GitHub

1. 点击 **Connect to Git** 或 **Settings** → **Git**
2. 点击 **Authorize Cloudflare**（授权访问 GitHub）
3. 选择仓库：`joshua-9919/image-bg-remover`
4. 点击 **Begin setup**

### 步骤 4：配置构建设置

```yaml
Project name: image-bg-remover
Production branch: main
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: (留空)
```

### 步骤 5：添加环境变量

点击 **Advanced** → **Add variable**：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `REMOVE_BG_API_KEY` | `PcjUokjmmGsEkmTfwwDSMqNh` | Production & Preview |

### 步骤 6：保存并部署

1. 点击 **Save and Deploy**
2. 等待构建完成（约 2-5 分钟）
3. 查看部署日志

---

## 🚀 使用部署脚本（可选）

如果不想用 Dashboard，可以用脚本部署：

```bash
# 1. 进入项目目录
cd /root/.openclaw/workspace/github/image-bg-remover

# 2. 赋予执行权限
chmod +x deploy-to-cloudflare.sh

# 3. 运行脚本
./deploy-to-cloudflare.sh
```

**注意：** 脚本会要求你登录 Cloudflare（浏览器授权）

---

## 📊 项目信息

- **Account ID:** `2989aa3dbcada0c1923fb3a13d48b897`
- **Project Name:** `image-bg-remover`
- **Production Branch:** `main`
- **GitHub 仓库:** https://github.com/joshua-9919/image-bg-remover

---

## 🌐 访问地址

部署成功后：

- **预览环境:** `https://image-bg-remover-83q.pages.dev`
- **生产环境:** `https://image-bg-remover.pages.dev`

---

## ⚠️ 重要配置

### Node.js 兼容性

在 Cloudflare Dashboard 中启用：
1. 进入项目 → **Settings** → **Functions**
2. 找到 **Node.js compatibility**
3. 开启开关

### 环境变量

**必须配置**，否则 API 调用会失败：

1. **Settings** → **Environment variables**
2. 添加：
   - 变量名：`REMOVE_BG_API_KEY`
   - 值：`PcjUokjmmGsEkmTfwwDSMqNh`
3. 点击 **Save**

---

## 🔍 故障排查

### 构建失败

检查构建日志，常见问题：
- Node.js 版本不兼容 → 启用 Node.js compatibility
- 依赖安装失败 → 检查 `package.json`
- 构建超时 → 优化构建配置

### 运行时错误

- 检查环境变量是否配置
- 查看 Functions 日志：**Deployment** → **View logs**

---

*创建时间：2026-03-25*
