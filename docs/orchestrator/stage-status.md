# Stage Status

| Stage | Status | Evidence | Gap |
|---|---|---|---|
| 00 setup | DONE | `wrangler.jsonc`, production custom domain, D1/KV/Assets bindings, GA4 `G-D659NXZZB3` installed, GSC HTML verification file deployed | GSC verification click and Bing not confirmed |
| 01 research | NEEDS_REVIEW | One Amazon seller guide exists | No stored keyword/SERP/competitor evidence |
| 02 PRD / route contract | NEEDS_REPAIR | `docs/image-bg-remover-mvp.md`, current routes | Route contract and NOT-DO list not frozen |
| 03 pricing | NEEDS_REPAIR | Public pricing + dashboard plans | PayPal live payment and credit arrival still unverified |
| 04 compliance | NEEDS_REPAIR | Privacy/Terms/Refund/Contact exist; support mail routes through Cloudflare Email Routing; privacy page discloses Google Analytics | Cookie banner/consent decision still pending if targeting consent-restricted regions |
| 05 SEO-copy freeze | NEEDS_REPAIR | Metadata, sitemap, one HowTo/FAQ article | Copy freeze file and page matrix missing |
| 06 design source | NEEDS_REVIEW | Existing responsive Tailwind UI | No design source/content-fit matrix |
| 07 frontend | PASS | Build and production smoke pass | Mobile header wrapping and public-page navigation verified after deploy |
| 08 backend/data | NEEDS_REPAIR | Worker, D1/KV, quota tests | PayPal live test and key rotation pending |
| 09 QA | RUNNING | `npm run build`, `npm run test:launch`, `npm run test:quota` | Browser/device evidence incomplete |
| 10 SEO recheck | NEEDS_REPAIR | robots/sitemap/canonical present; GA4 installed and verified in production HTML; GSC verification file returns 200 | GSC owner verification click, sitemap submission, Bing, IndexNow/Crawler Hints missing or unverified |
| 11 launch | BLOCKED_OWNER | Production deploy works | Owner must approve payment/live ops/public submissions |
| 12 data review | WAITING | None | Needs analytics/search/payment/user funnel data |
