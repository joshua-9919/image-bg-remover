#!/bin/bash

# Cloudflare Pages 部署脚本
# 使用方式：./deploy-to-cloudflare.sh

set -e

# 配置变量
CLOUDFLARE_API_TOKEN="cfk_ghg7JSyv27GqoNmDsVGGMgBYtCbr8f9JrX9EmFVH535e411a"
CLOUDFLARE_ACCOUNT_ID="2989aa3dbcada0c1923fb3a13d48b897"
PROJECT_NAME="image-bg-remover"
REMOVE_BG_API_KEY="PcjUokjmmGsEkmTfwwDSMqNh"

echo "🔧 开始配置 Cloudflare Pages 部署..."

# 检查 Wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  未检测到 Wrangler CLI，正在安装..."
    npm install -g wrangler
fi

# 登录 Cloudflare
echo "🔐 登录 Cloudflare..."
wrangler login

# 构建项目
echo "🏗️  构建 Next.js 项目..."
npm run build

# 部署到 Cloudflare Pages
echo "🚀 部署到 Cloudflare Pages..."
wrangler pages deploy .next \
  --project-name=$PROJECT_NAME \
  --branch=main \
  --commit-dirty=true

echo "✅ 部署完成！"
echo ""
echo "📊 项目信息："
echo "   - 项目名：$PROJECT_NAME"
echo "   - 预览域名：https://$PROJECT_NAME.pages.dev"
echo ""
echo "⚠️  重要：需要在 Cloudflare Dashboard 添加环境变量"
echo "   1. 访问：https://dash.cloudflare.com/"
echo "   2. 进入 Workers & Pages → $PROJECT_NAME"
echo "   3. 设置 → Environment variables"
echo "   4. 添加变量：REMOVE_BG_API_KEY = $REMOVE_BG_API_KEY"
echo "   5. 点击 Save and Deploy"
