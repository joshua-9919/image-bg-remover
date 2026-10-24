import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "app/pricing/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/refund/page.tsx",
  "app/contact/page.tsx",
  "app/blog/page.tsx",
  "app/blog/remove-background-amazon/page.tsx",
  "public/robots.txt",
  "public/sitemap.xml",
  "public/favicon.svg",
  "public/logo.svg",
  "public/og-image.png",
  "public/icon-192.png",
  "public/icon-512.png",
  "public/apple-touch-icon.png",
];

const failures = [];
const leakedSecrets = [
  "PcjUokjmmGsEkmTfwwDSMqNh",
];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const file of ["CLOUDFLARE_DEPLOY.md", "CLOUDFLARE_SETUP.md", "README.md", "worker.js", ".env.example"]) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const content = read(file);
  for (const secret of leakedSecrets) {
    if (content.includes(secret)) failures.push(`Potential secret leak in ${file}`);
  }
}

if (fs.existsSync(path.join(root, "public/sitemap.xml"))) {
  const sitemap = read("public/sitemap.xml");
  for (const url of ["/privacy", "/terms", "/refund", "/pricing", "/contact", "/blog", "/blog/remove-background-amazon"]) {
    if (!sitemap.includes(`https://image-bg-remove.shop${url}`)) failures.push(`Sitemap missing ${url}`);
  }
  for (const blocked of ["/login", "/dashboard"]) {
    if (sitemap.includes(`https://image-bg-remove.shop${blocked}`)) failures.push(`Sitemap should not include ${blocked}`);
  }
}

if (fs.existsSync(path.join(root, "app/layout.tsx"))) {
  const layout = read("app/layout.tsx");
  for (const token of ["metadataBase", "alternates", "openGraph", "twitter", "robots"]) {
    if (!layout.includes(token)) failures.push(`Metadata missing ${token}`);
  }
  for (const asset of ["/og-image.png", "/favicon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"]) {
    if (!layout.includes(asset)) failures.push(`Metadata missing brand asset ${asset}`);
  }
}

if (fs.existsSync(path.join(root, "app/page.tsx"))) {
  const home = read("app/page.tsx");
  for (const link of ["/pricing", "/privacy", "/terms", "/contact"]) {
    if (!home.includes(`href="${link}"`)) failures.push(`Home/footer missing link ${link}`);
  }
}

if (fs.existsSync(path.join(root, "worker.js"))) {
  const worker = read("worker.js");
  for (const token of ["redirectToHttps", "securityHeaders", "verifyGoogleJwt", "verifyPaypalWebhook"]) {
    if (!worker.includes(token)) failures.push(`Worker missing ${token}`);
  }
  if (!worker.includes("env.ASSETS.fetch(request)")) failures.push("Worker should serve static assets after API routes");
  if (worker.includes('"Access-Control-Allow-Origin": "*"')) failures.push("CORS should not allow every origin");
  for (const planId of ["starter", "standard", "pro_pack", "basic_monthly", "pro_monthly"]) {
    if (!worker.includes(`${planId}:`)) failures.push(`Worker payment config missing plan ${planId}`);
  }
}

if (fs.existsSync(path.join(root, "app/dashboard/page.tsx"))) {
  const dashboard = read("app/dashboard/page.tsx");
  for (const planId of ['id: "starter"', 'id: "standard"', 'id: "pro_pack"', 'id: "basic_monthly"', 'id: "pro_monthly"']) {
    if (!dashboard.includes(planId)) failures.push(`Dashboard missing payment plan ${planId}`);
  }
  for (const stalePlanId of ['id: "pro"', 'id: "enterprise300"', 'id: "enterprise800"']) {
    if (dashboard.includes(stalePlanId)) failures.push(`Dashboard still references stale payment plan ${stalePlanId}`);
  }
}

if (fs.existsSync(path.join(root, "wrangler.jsonc"))) {
  const wrangler = read("wrangler.jsonc");
  if (!wrangler.includes('"binding": "ASSETS"')) failures.push("Wrangler assets should bind ASSETS");
  if (!wrangler.includes('"run_worker_first": true')) failures.push("Wrangler should run worker first for HTTPS/security handling");
  if (!wrangler.includes('"custom_domain": true')) failures.push("Wrangler should preserve custom domain route");
}

if (failures.length) {
  console.error("Launch checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Launch checks passed");
