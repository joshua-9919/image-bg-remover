# Blocked Log

## RESOLVED: Remove background provider key rotation
- 类型：API Key / security
- 原因：旧部署说明文档曾包含真实 `REMOVE_BG_API_KEY`。
- 状态：owner 已确认 `REMOVE_BG_API_KEY` 已轮换；Cloudflare Secret 列表确认变量存在；轮换后真实去背景处理已验证正常。
- 系统会继续：关闭 P0，进入 PayPal live payment test。

## P1: PayPal live payment test
- 类型：付款 / production verification
- 原因：Cloudflare Worker PayPal Variables/secrets 已确认使用 Live 变量；代码可创建 PayPal order/subscription，但 live checkout、capture、webhook、额度到账仍需真实验证。
- 你要做什么：用小额真实账号完成一次按量包购买和一次订阅测试，或明确先只测按量包。
- 做完后回复：`PayPal 按量包已成功` / `PayPal 订阅已成功`
- 系统会继续：核对 D1 order/user credits/subscription 状态

## P1: Webmaster setup and optional analytics expansion
- 类型：GSC / Bing / GA4 / Clarity
- 原因：GA4 已安装并在生产 HTML 中验证；GSC HTML 验证文件已部署且返回 200；SEO launch gate 仍需要 owner 在 GSC 点击验证、提交 sitemap，并补 Bing 提交证据。Clarity 是否安装待 owner 决策。
- 你要做什么：在 GSC 弹窗点击“验证”，验证成功后提交 `https://image-bg-remove.shop/sitemap.xml`；确认是否要接 Clarity，并完成 Bing Webmaster 站点验证与 sitemap 提交。
- 做完后回复：`GSC/Bing 已提交` / `允许接 Clarity`
- 系统会继续：验证 sitemap 提交与数据链路

## P2: Research and copy freeze evidence
- 类型：产品/SEO 文档
- 原因：已有页面和一篇博客，但没有冻结的关键词机会、SERP、竞品最低能力、页面矩阵。
- 你要做什么：确认是否按当前关键词继续补 research/copy freeze，还是先上线验证。
- 做完后回复：`先补 research` 或 `先上线验证`
