import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workerPath = path.join(root, "worker.js");
const worker = fs.readFileSync(workerPath, "utf8");
const failures = [];

function requireToken(token, message) {
  if (!worker.includes(token)) failures.push(message);
}

requireToken("checkWebSessionQuota", "Worker should check logged-in web/session quota separately from API key quota");
requireToken("incrementWebSessionUsage", "Worker should increment web/session usage only after successful background removal");
requireToken("syncFreeWebDailyUsage", "Worker should reconcile prior successful web/session usage logs for free users");
requireToken('authInfo.authType === "api_key"', "Remove endpoint should branch API key quota logic by auth type");
requireToken("free_daily_used = ?", "Free web/session users should update users.free_daily_used");
requireToken("api_key_id IS NULL", "Free web/session quota reconciliation should not include API key usage");
requireToken("free_trial_api", "API key free trial quota table should remain supported");
requireToken("api_key_id IS NOT NULL", "API key trial quota should remain based on API-key usage logs");

const removeBgMatch = worker.match(/async function handleRemoveBg\(request, env\) \{[\s\S]*?\n\}/);
if (!removeBgMatch) {
  failures.push("Could not find handleRemoveBg");
} else {
  const removeBg = removeBgMatch[0];
  if (!removeBg.includes("checkWebSessionQuota(authInfo.user, env)")) {
    failures.push("handleRemoveBg should check web/session quota for non-API-key users");
  }
  if (!removeBg.includes("incrementWebSessionUsage(authInfo.user, env)")) {
    failures.push("handleRemoveBg should deduct web/session quota after successful processing");
  }
}

if (failures.length) {
  console.error("Quota logic checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Quota logic checks passed");
