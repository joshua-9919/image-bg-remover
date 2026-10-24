# Launch Gates

## Current Evidence
- production_url: https://image-bg-remove.shop
- deploy target: Cloudflare Workers custom domain
- latest_deploy_version: 92a818ad-97f2-4b11-9ea3-4304a3b967cd
- local checks:
  - `npm run build`: PASS
  - `npm run test:launch`: PASS
  - `npm run test:quota`: PASS
- already verified in prior QA:
  - HTTPS homepage returns 200
  - `/api/plans` returns 200
  - Google login -> dashboard works
  - logout invalidates session
  - guest quota reaches 3 then blocks
  - logged-in free quota reaches 3 then blocks
  - Cloudflare Secret list contains `REMOVE_BG_API_KEY` after owner rotation
  - remove provider key post-rotation functional proof: PASS, owner verified one real background removal
  - PayPal Cloudflare variables/secrets are Live values
  - support email routing: Cloudflare Email Routing forwards domain support mail to owner Gmail
  - GA4 installed: `G-D659NXZZB3`; production HTML contains Google tag
  - GSC HTML verification file deployed: `/googlec70e1e5ca44375e6.html` returns 200 with expected verification text
  - public extensionless routes verified after GSC fix: `/pricing`, `/blog`, `/blog/remove-background-amazon`, `/contact`, `/privacy`, `/terms`, `/refund` return 200

## Missing Before Full Launch
- commit_sha: pending
- pushed_branch: pending
- PayPal live payment proof: pending
- successful credit/subscription arrival proof: pending
- mobile screenshot evidence: pending
- console/network browser evidence: pending
- Clarity evidence/decision: pending
- GSC owner verification click and sitemap submission evidence: pending
- Bing sitemap evidence: pending
- IndexNow/Crawler Hints decision: pending
- git_status_after: pending
