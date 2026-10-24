# Project Control Board

项目：image-bg-remover
域名：https://image-bg-remove.shop
目标市场：US / English primary, multilingual UI supported
项目类型：AI tool site + account + PayPal monetization + API access
当前模式：automation_factory
当前状态：QA_REPAIR
事实源：docs/orchestrator/*

## 学员只需要处理
- [x] 域名已绑定 Cloudflare Workers custom domain
- [x] Cloudflare Workers / D1 / KV / Assets 可部署
- [x] Google 登录真实流程已验证
- [x] 游客 3 次限制已验证
- [x] 登录 free 用户每日 3 次限制已修复并验证
- [ ] PayPal live 付款真实流程验证
- [x] Cloudflare Worker PayPal Variables/secrets 已确认使用 Live 变量
- [x] REMOVE_BG_API_KEY 已泄露到历史文档，已由 owner 轮换；轮换后真实处理已验证正常
- [x] 用户支持邮件通过 Cloudflare Email Routing 转发到 owner Gmail；前台保留域名邮箱 `support@image-bg-remove.shop`
- [ ] GSC / Bing Webmaster / GA4 或 Clarity 权限与安装状态待确认
- [ ] 公开发布、目录提交、外链动作待人工确认

## 自动流水线
- 01 research：NEEDS_REVIEW
- 02 PRD / route contract：NEEDS_REPAIR
- 03 pricing：NEEDS_REPAIR
- 04 compliance：NEEDS_REPAIR
- 05 SEO-copy freeze：NEEDS_REPAIR
- 06 design source：NEEDS_REVIEW
- 08 backend/data：NEEDS_REPAIR
- 07 frontend：NEEDS_REPAIR
- 10 SEO recheck：NEEDS_REPAIR
- 09 QA：RUNNING
- 11 launch：BLOCKED_OWNER
- 12 data review：WAITING

## 当前状态
- running：07 frontend repair, 08 backend/payment repair, 09 QA evidence
- waiting：01 research evidence, 02 PRD route contract, 05 SEO-copy freeze, 10 webmaster/analytics setup
- blocked：PayPal live payment test, public launch ops confirmation
- done：HTTPS redirect, custom domain route, Cloudflare Email Routing, core remove API, Google login, quota enforcement, legal/pricing/contact/blog pages, sitemap/robots
