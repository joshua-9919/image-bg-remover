// ============================================================
// image-bg-remover Worker — 完整用户体系
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS
    if (method === "OPTIONS") return corsResponse();

    // --- API 路由 ---
    if (url.pathname === "/api/auth/login" && method === "POST")
      return withCors(handleLogin(request, env));
    if (url.pathname === "/api/auth/logout" && method === "POST")
      return withCors(handleLogout(request, env));
    if (url.pathname === "/api/user/profile" && method === "GET")
      return withCors(handleGetProfile(request, env));
    if (url.pathname === "/api/user/history" && method === "GET")
      return withCors(handleGetHistory(request, env));
    if (url.pathname === "/api/user/usage" && method === "GET")
      return withCors(handleGetUsage(request, env));
    if (url.pathname === "/api/remove" && method === "POST")
      return withCors(handleRemoveBg(request, env));
    if (url.pathname === "/api/plans" && method === "GET")
      return withCors(handleGetPlans());

    // --- API Key 管理路由 ---
    if (url.pathname === "/api/key/generate" && method === "POST")
      return withCors(handleGenerateApiKey(request, env));
    if (url.pathname === "/api/key/list" && method === "GET")
      return withCors(handleListApiKeys(request, env));
    if (url.pathname === "/api/key/delete" && method === "POST")
      return withCors(handleDeleteApiKey(request, env));
    if (url.pathname === "/api/key/regenerate" && method === "POST")
      return withCors(handleRegenerateApiKey(request, env));

    // --- PayPal 支付路由 ---
    if (url.pathname === "/api/paypal/create-order" && method === "POST")
      return withCors(handlePaypalCreateOrder(request, env));
    if (url.pathname === "/api/paypal/capture-order" && method === "POST")
      return withCors(handlePaypalCaptureOrder(request, env));
    if (url.pathname === "/api/paypal/create-subscription" && method === "POST")
      return withCors(handlePaypalCreateSubscription(request, env));
    if (url.pathname === "/api/paypal/cancel-subscription" && method === "POST")
      return withCors(handlePaypalCancelSubscription(request, env));
    if (url.pathname === "/api/paypal/webhook" && method === "POST")
      return withCors(handlePaypalWebhook(request, env));

    // 静态文件请求应该由 Cloudflare 自动处理，不会到达这里
    // 如果到达这里，返回 404
    return new Response("Not Found", { status: 404 });
  },
};

// ============================================================
// CORS
// ============================================================
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  };
}
function corsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
async function withCors(promise) {
  const res = await promise;
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}

// ============================================================
// 工具函数
// ============================================================
function uuid() {
  return crypto.randomUUID();
}
function now() {
  return Date.now();
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function json(data, status = 200) {
  return Response.json(data, { status });
}
function err(code, message, status = 400) {
  return json({ success: false, error: { code, message } }, status);
}

// 解码 Google JWT（不验证签名，前端已验证）
function decodeGoogleJwt(token) {
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// 数据库初始化（启动时自动建表）
// ============================================================
async function ensureTables(env) {
  try {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'My API Key',
        daily_limit INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        last_used_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } catch {}
  try {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS free_trial_api (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        start_at INTEGER NOT NULL,
        end_at INTEGER NOT NULL,
        daily_limit INTEGER NOT NULL DEFAULT 30,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } catch {}
  try {
    await env.DB.exec(`ALTER TABLE usage_logs ADD COLUMN api_key_id TEXT`);
  } catch {}
  try {
    await env.DB.exec(`ALTER TABLE usage_logs ADD COLUMN api_key_name TEXT`);
  } catch {}
}

// ============================================================
// API Key 工具函数
// ============================================================
const API_KEY_SALT = "image-bg-remover-api-key-salt-v1";

async function hashApiKey(key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key + API_KEY_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateRandomKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "sk_ibr_";
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 从请求获取当前用户（支持 session token 或 API Key）
async function getUser(request, env) {
  // 1. 先尝试 session token
  const auth = request.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const sessionData = await env.SESSIONS.get(token);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.userId).first();
      if (user) return { user, authType: "session", apiKeyId: null, apiKeyName: null };
    }
  }
  // 2. 尝试 API Key
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey) {
    const keyHash = await hashApiKey(apiKey);
    const keyRecord = await env.DB.prepare(
      "SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1"
    ).bind(keyHash).first();
    if (keyRecord) {
      const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(keyRecord.user_id).first();
      if (user) {
        await env.DB.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?")
          .bind(now(), keyRecord.id).run();
        return { user, authType: "api_key", apiKeyId: keyRecord.id, apiKeyName: keyRecord.name };
      }
    }
  }
  // 3. 未登录访客
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return { user: null, authType: "guest", apiKeyId: null, apiKeyName: null, ip };
}

// ============================================================
// 获取用户可用额度
// ============================================================
async function getUserQuota(user, env) {
  const planType = user.plan_type || "free";
  if (planType === "subscription") {
    if (now() >= (user.subscription_end || 0)) {
      return { allowed: false, reason: "subscription_expired", message: "订阅已过期，请续费" };
    }
    const today = todayStr();
    const resetDate = user.month_reset_date;
    const currentMonth = today.slice(0, 7);
    if (!resetDate || !resetDate.startsWith(currentMonth)) {
      await env.DB.prepare("UPDATE users SET used_this_month = 0, month_reset_date = ? WHERE id = ?").bind(today, user.id).run();
      user.used_this_month = 0;
    }
    const remaining = Math.max(0, (user.monthly_quota || 0) - (user.used_this_month || 0));
    return { allowed: remaining > 0, reason: remaining > 0 ? "subscription" : "quota_exceeded", quotaType: "subscription", remaining, message: remaining > 0 ? `订阅额度剩余 ${remaining} 次` : "本月额度已用完" };
  }
  if (planType === "credits") {
    if ((user.credits || 0) <= 0) return { allowed: false, reason: "quota_exceeded", message: "额度已用完，请购买套餐" };
    return { allowed: true, reason: "credits", quotaType: "credits", remaining: user.credits, message: `剩余 ${user.credits} 次` };
  }
  if (planType === "free") {
    const trial = await env.DB.prepare("SELECT * FROM free_trial_api WHERE user_id = ?").bind(user.id).first();
    if (!trial) { const newTrial = await initFreeTrialApi(user.id, env); return await checkFreeTrialQuota(newTrial, env); }
    return await checkFreeTrialQuota(trial, env);
  }
  return { allowed: false, reason: "unknown", message: "未知账户类型" };
}

async function checkFreeTrialQuota(trial, env) {
  const nowMs = now();
  if (nowMs >= trial.end_at) return { allowed: false, reason: "trial_expired", message: `免费试用已到期（${FREE_TRIAL_API.trialDays} 天），请购买套餐` };
  const today = todayStr();
  const todayStart = new Date(today).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  const todayUsage = await env.DB.prepare("SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND api_key_id IS NOT NULL AND created_at >= ? AND created_at < ?").bind(trial.user_id, todayStart, todayEnd).first();
  const used = todayUsage?.cnt || 0;
  const remaining = Math.max(0, trial.daily_limit - used);
  const daysLeft = Math.ceil((trial.end_at - nowMs) / (24 * 60 * 60 * 1000));
  if (remaining <= 0) return { allowed: false, reason: "daily_limit", quotaType: "free_trial", message: `今日免费试用次数已用完（${trial.daily_limit} 次/天），剩余 ${daysLeft} 天试用` };
  return { allowed: true, reason: "free_trial", quotaType: "free_trial", remaining, dailyLimit: trial.daily_limit, daysLeft, message: `免费试用：今日剩余 ${remaining}/${trial.daily_limit} 次，试用剩余 ${daysLeft} 天` };
}

async function initFreeTrialApi(userId, env) {
  await ensureTables(env);
  const existing = await env.DB.prepare("SELECT * FROM free_trial_api WHERE user_id = ?").bind(userId).first();
  if (existing) return existing;
  const timestamp = now();
  const trialEnd = timestamp + FREE_TRIAL_API.trialDays * 24 * 60 * 60 * 1000;
  await env.DB.prepare(`INSERT INTO free_trial_api (id, user_id, start_at, end_at, daily_limit, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(uuid(), userId, timestamp, trialEnd, FREE_TRIAL_API.dailyLimit, timestamp).run();
  return { user_id: userId, start_at: timestamp, end_at: trialEnd, daily_limit: FREE_TRIAL_API.dailyLimit };
}

// ============================================================
// 定价方案
// ============================================================
const PLANS = {
  // 按量包
  starter:  { name: "Starter",  type: "credits", price: 1.69, credits: 100 },
  standard: { name: "Standard", type: "credits", price: 4.69, credits: 300 },
  pro_pack: { name: "Pro Pack", type: "credits", price: 9.69, credits: 800 },
  // 月订阅
  basic_monthly: { name: "Basic",  type: "subscription", price: 9.99, credits: 1000 },
  pro_monthly:   { name: "Pro",    type: "subscription", price: 19.99, credits: 2000 },
};

// 免费 API 试用配置
const FREE_TRIAL_API = {
  dailyLimit: 30,   // 每天 30 次
  trialDays: 5,     // 共 5 天
};
const FREE_TRIAL_DAYS = 3;
const FREE_DAILY_LIMIT = 3;
const GUEST_LIMIT = 3;

// ============================================================
// POST /api/auth/login — Google 登录
// ============================================================
async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const { credential } = body;
    if (!credential) return err("NO_CREDENTIAL", "缺少 Google credential");

    const payload = decodeGoogleJwt(credential);
    if (!payload || !payload.sub || !payload.email) {
      return err("INVALID_TOKEN", "无效的 Google token");
    }

    const { sub: googleId, email, name, picture } = payload;

    // 查找或创建用户
    let user = await env.DB.prepare("SELECT * FROM users WHERE google_id = ?").bind(googleId).first();

    if (!user) {
      // 也尝试通过 email 查找
      user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    }

    const timestamp = now();

    if (!user) {
      // 新用户
      const userId = uuid();
      await env.DB.prepare(
        `INSERT INTO users (id, google_id, name, email, image, created_at, updated_at, plan_type, credits, free_trial_start, free_daily_used, free_daily_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'free', 0, ?, 0, ?)`
      ).bind(userId, googleId, name, email, picture, timestamp, timestamp, timestamp, todayStr()).run();

      user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    } else {
      // 更新现有用户
      await env.DB.prepare(
        `UPDATE users SET google_id = ?, name = ?, image = ?, updated_at = ? WHERE id = ?`
      ).bind(googleId, name, picture, timestamp, user.id).run();

      // 如果是首次设置 free_trial_start
      if (!user.free_trial_start) {
        await env.DB.prepare(
          `UPDATE users SET free_trial_start = ?, free_daily_used = 0, free_daily_date = ? WHERE id = ?`
        ).bind(timestamp, todayStr(), user.id).run();
      }

      user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
    }

    // 创建 session token
    const sessionToken = uuid() + "-" + uuid();
    const sessionData = { userId: user.id, email: user.email, createdAt: timestamp };
    await env.SESSIONS.put(sessionToken, JSON.stringify(sessionData), { expirationTtl: 60 * 60 * 24 * 30 }); // 30天

    return json({
      success: true,
      data: {
        token: sessionToken,
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error("login error:", error.message, error.stack);
    return err("LOGIN_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/auth/logout
// ============================================================
async function handleLogout(request, env) {
  const auth = request.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) {
    await env.SESSIONS.delete(auth.slice(7));
  }
  return json({ success: true });
}

// ============================================================
// GET /api/user/profile
// ============================================================
async function handleGetProfile(request, env) {
  const { user } = await getUser(request, env);
  if (!user) return err("UNAUTHORIZED", "请先登录", 401);
  return json({ success: true, data: formatUser(user) });
}

// ============================================================
// GET /api/user/usage — 获取额度信息
// ============================================================
async function handleGetUsage(request, env) {
  const { user } = await getUser(request, env);
  if (!user) return err("UNAUTHORIZED", "请先登录", 401);

  const usage = calculateUsage(user);

  // 获取今日和本月使用量
  const today = todayStr();
  const monthStart = today.slice(0, 7) + "-01";

  const todayCount = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND date(created_at/1000, 'unixepoch') = ?"
  ).bind(user.id, today).first();

  const monthCount = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND date(created_at/1000, 'unixepoch') >= ?"
  ).bind(user.id, monthStart).first();

  // 获取 API Key 列表和各自用量
  const apiKeys = await env.DB.prepare(
    "SELECT id, name, created_at, last_used_at FROM api_keys WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).all();

  const keyUsages = [];
  for (const key of (apiKeys.results || [])) {
    const todayUsage = await env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND api_key_id = ? AND date(created_at/1000, 'unixepoch') = ?"
    ).bind(user.id, key.id, today).first();
    keyUsages.push({ id: key.id, name: key.name, createdAt: key.created_at, lastUsedAt: key.last_used_at, todayUsed: todayUsage?.cnt || 0 });
  }

  return json({
    success: true,
    data: {
      ...usage,
      todayUsed: todayCount?.cnt || 0,
      monthUsed: monthCount?.cnt || 0,
      apiKeys: keyUsages,
    },
  });
}

// ============================================================
// GET /api/user/history — 处理历史
// ============================================================
async function handleGetHistory(request, env) {
  const { user } = await getUser(request, env);
  if (!user) return err("UNAUTHORIZED", "请先登录", 401);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  const records = await env.DB.prepare(
    "SELECT * FROM image_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(user.id, limit, offset).all();

  const total = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM image_history WHERE user_id = ?"
  ).bind(user.id).first();

  return json({
    success: true,
    data: {
      records: records.results || [],
      total: total?.cnt || 0,
      page,
      limit,
    },
  });
}

// ============================================================
// GET /api/plans — 获取定价方案
// ============================================================
async function handleGetPlans() {
  return json({
    success: true,
    data: {
      creditPacks: [
        { id: "starter", name: "Starter", price: 1.69, credits: 100, perImage: "$0.017" },
        { id: "standard", name: "Standard", price: 4.69, credits: 300, perImage: "$0.016", popular: true },
        { id: "pro_pack", name: "Pro Pack", price: 9.69, credits: 800, perImage: "$0.012", bestValue: true },
      ],
      subscriptions: [
        { id: "basic_monthly", name: "Basic", price: 9.99, credits: 1000, period: "month", perImage: "$0.010" },
        { id: "pro_monthly", name: "Pro", price: 19.99, credits: 2000, period: "month", perImage: "$0.010", popular: true },
      ],
      free: {
        guestLimit: GUEST_LIMIT,
        dailyLimit: FREE_DAILY_LIMIT,
        trialDays: FREE_TRIAL_DAYS,
      },
      freeApiTrial: {
        dailyLimit: FREE_TRIAL_API.dailyLimit,
        trialDays: FREE_TRIAL_API.trialDays,
        description: "注册后即可获得 API 免费试用",
      },
    },
  });
}

// ============================================================
// POST /api/key/generate — 生成 API Key
// ============================================================
async function handleGenerateApiKey(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);
    const body = await request.json().catch(() => ({}));
    const name = body.name || "My API Key";
    await ensureTables(env);
    const rawKey = generateRandomKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12) + "...";
    const keyId = uuid();
    const timestamp = now();
    await env.DB.prepare(
      `INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, daily_limit, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    ).bind(keyId, user.id, keyHash, keyPrefix, name, 0, timestamp).run();
    await initFreeTrialApi(user.id, env);
    return json({ success: true, data: { id: keyId, name, apiKey: rawKey, prefix: keyPrefix, createdAt: timestamp, message: "请妥善保存 API Key，之后无法查看完整内容" } });
  } catch (error) {
    console.error("generate-api-key error:", error.message);
    return err("KEY_GEN_ERROR", error.message, 500);
  }
}

// ============================================================
// GET /api/key/list — 列出用户的 API Keys
// ============================================================
async function handleListApiKeys(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);
    const keys = await env.DB.prepare("SELECT id, name, key_prefix, daily_limit, is_active, created_at, last_used_at FROM api_keys WHERE user_id = ?").bind(user.id).all();
    const today = todayStr();
    const result = [];
    for (const k of (keys.results || [])) {
      const todayUsage = await env.DB.prepare("SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND api_key_id = ? AND date(created_at/1000, 'unixepoch') = ?").bind(user.id, k.id, today).first();
      const totalUsage = await env.DB.prepare("SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND api_key_id = ?").bind(user.id, k.id).first();
      result.push({ id: k.id, name: k.name, prefix: k.key_prefix, dailyLimit: k.daily_limit, isActive: k.is_active === 1, createdAt: k.created_at, lastUsedAt: k.last_used_at, todayUsed: todayUsage?.cnt || 0, totalUsed: totalUsage?.cnt || 0 });
    }
    return json({ success: true, data: result });
  } catch (error) {
    console.error("list-api-keys error:", error.message);
    return err("LIST_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/key/delete — 删除 API Key
// ============================================================
async function handleDeleteApiKey(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);
    const body = await request.json();
    const { keyId } = body;
    if (!keyId) return err("NO_KEY_ID", "缺少 keyId", 400);
    const key = await env.DB.prepare("SELECT * FROM api_keys WHERE id = ? AND user_id = ?").bind(keyId, user.id).first();
    if (!key) return err("KEY_NOT_FOUND", "Key 不存在", 404);
    await env.DB.prepare("UPDATE api_keys SET is_active = 0 WHERE id = ?").bind(keyId).run();
    return json({ success: true, data: { message: "API Key 已删除" } });
  } catch (error) {
    console.error("delete-api-key error:", error.message);
    return err("DELETE_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/key/regenerate — 重新生成 API Key
// ============================================================
async function handleRegenerateApiKey(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);
    const body = await request.json();
    const { keyId } = body;
    if (!keyId) return err("NO_KEY_ID", "缺少 keyId", 400);
    const key = await env.DB.prepare("SELECT * FROM api_keys WHERE id = ? AND user_id = ?").bind(keyId, user.id).first();
    if (!key) return err("KEY_NOT_FOUND", "Key 不存在", 404);
    const rawKey = generateRandomKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12) + "...";
    await env.DB.prepare("UPDATE api_keys SET key_hash = ?, key_prefix = ?, last_used_at = NULL WHERE id = ?").bind(keyHash, keyPrefix, keyId).run();
    return json({ success: true, data: { id: keyId, name: key.name, apiKey: rawKey, prefix: keyPrefix, message: "请妥善保存新的 API Key" } });
  } catch (error) {
    console.error("regenerate-api-key error:", error.message);
    return err("REGEN_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/remove — 去背景（支持 API Key 认证）
// ============================================================
async function handleRemoveBg(request, env) {
  try {
    await ensureTables(env);

    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return err("NO_FILE", "请上传图片文件", 400);
    }

    // 获取用户（session token 或 API Key）
    const authInfo = await getUser(request, env);

    // 未登录且无 API Key：检查访客额度
    if (!authInfo.user && authInfo.authType === "guest") {
      const ip = authInfo.ip;
      const guestKey = `guest:${ip}`;
      const guestData = await env.SESSIONS.get(guestKey);
      const guest = guestData ? JSON.parse(guestData) : { count: 0 };

      if (guest.count >= GUEST_LIMIT) {
        return err("GUEST_LIMIT", "免费试用已用完，请注册登录获得更多额度", 403);
      }

      guest.count++;
      await env.SESSIONS.put(guestKey, JSON.stringify(guest), { expirationTtl: 60 * 60 * 24 * 365 });
    }

    // 已登录用户：检查额度
    if (authInfo.user) {
      const quota = await getUserQuota(authInfo.user, env);
      if (!quota.allowed) {
        return err("QUOTA_EXCEEDED", quota.message, 403);
      }
    }

    // 调用 RemoveBG API
    const apiKey = env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return err("API_ERROR", "服务配置错误", 500);
    }

    const startTime = now();
    const removeBgFormData = new FormData();
    removeBgFormData.append("image_file", imageFile);

    const apiResponse = await fetch("https://api.poof.bg/v1/remove", {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: removeBgFormData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text().catch(() => "未知错误");
      console.error(`RemoveBG API error: ${apiResponse.status} - ${errorText}`);
      throw new Error(`API 返回 ${apiResponse.status}`);
    }

    const contentType = apiResponse.headers.get("content-type") || "";
    let base64Image;

    if (contentType.includes("image")) {
      const buf = await apiResponse.arrayBuffer();
      base64Image = bufferToBase64(buf);
    } else {
      const result = await apiResponse.json();
      if (result.result_url) {
        const imgRes = await fetch(result.result_url);
        const buf = await imgRes.arrayBuffer();
        base64Image = bufferToBase64(buf);
      } else {
        throw new Error("API 返回格式异常");
      }
    }

    // 记录使用日志（关联 api_key_id）
    if (authInfo.user) {
      await env.DB.prepare(
        "INSERT INTO usage_logs (id, user_id, action, credits_used, created_at, api_key_id, api_key_name) VALUES (?, ?, 'remove_bg', 1, ?, ?, ?)"
      ).bind(uuid(), authInfo.user.id, now(), authInfo.apiKeyId, authInfo.apiKeyName || null).run();

      // 扣减额度（订阅用户）
      const planType = authInfo.user.plan_type || "free";
      if (planType === "subscription") {
        await env.DB.prepare("UPDATE users SET used_this_month = used_this_month + 1, updated_at = ? WHERE id = ?").bind(now(), authInfo.user.id).run();
      } else if (planType === "credits") {
        await env.DB.prepare("UPDATE users SET credits = credits - 1, updated_at = ? WHERE id = ?").bind(now(), authInfo.user.id).run();
      }

      // 记录到 image_history
      await env.DB.prepare(
        "INSERT INTO image_history (id, user_id, file_name, file_size, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(uuid(), authInfo.user.id, imageFile.name || "image.png", imageFile.size || 0, now()).run();
    }

    return json({
      success: true,
      data: {
        imageBase64: `data:image/png;base64,${base64Image}`,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("handleRemoveBg error:", error.message, error.stack);
    return err("PROCESSING_ERROR", error.message || "处理失败", 500);
  }
}

// ============================================================
// 额度计算逻辑
// ============================================================
function calculateUsage(user) {
  const today = todayStr();
  const trialStart = user.free_trial_start;
  const planType = user.plan_type || "free";

  if (planType === "free") {
    // 免费用户
    if (!trialStart) {
      return { planType: "free", remaining: 0, message: "请登录开始免费试用" };
    }

    const trialEnd = trialStart + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const isTrialActive = now() < trialEnd;
    const daysLeft = Math.max(0, Math.ceil((trialEnd - now()) / (24 * 60 * 60 * 1000)));

    if (!isTrialActive) {
      return { planType: "free", remaining: 0, trialExpired: true, message: "免费试用已到期，请购买套餐" };
    }

    const dailyUsed = (user.free_daily_date === today) ? (user.free_daily_used || 0) : 0;
    const dailyRemaining = Math.max(0, FREE_DAILY_LIMIT - dailyUsed);

    return {
      planType: "free",
      remaining: dailyRemaining,
      dailyLimit: FREE_DAILY_LIMIT,
      dailyUsed,
      daysLeft,
      trialExpired: false,
      message: `免费试用：今日剩余 ${dailyRemaining}/${FREE_DAILY_LIMIT} 张，试用剩余 ${daysLeft} 天`,
    };
  }

  if (planType === "credits") {
    // 按量包
    const remaining = user.credits || 0;
    return {
      planType: "credits",
      planName: user.subscription_plan || "Credits",
      remaining,
      message: remaining > 0 ? `剩余 ${remaining} 张` : "额度已用完，请购买套餐",
    };
  }

  if (planType === "subscription") {
    // 月订阅
    const subEnd = user.subscription_end || 0;
    const isActive = now() < subEnd;
    const remaining = isActive ? Math.max(0, (user.monthly_quota || 0) - (user.used_this_month || 0)) : 0;

    return {
      planType: "subscription",
      planName: user.subscription_plan || "Subscription",
      remaining,
      monthlyQuota: user.monthly_quota || 0,
      usedThisMonth: user.used_this_month || 0,
      isActive,
      expiresAt: subEnd,
      message: isActive ? `本月剩余 ${remaining}/${user.monthly_quota} 张` : "订阅已过期",
    };
  }

  return { planType: "unknown", remaining: 0, message: "未知套餐" };
}

async function checkAndDeductCredits(user, env) {
  const today = todayStr();
  const planType = user.plan_type || "free";

  if (planType === "free") {
    // 免费用户
    if (!user.free_trial_start) {
      return { allowed: false, message: "请先注册开始免费试用" };
    }

    const trialEnd = user.free_trial_start + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;
    if (now() >= trialEnd) {
      return { allowed: false, message: "免费试用已到期，请购买套餐继续使用" };
    }

    // 重置每日计数
    let dailyUsed = user.free_daily_used || 0;
    if (user.free_daily_date !== today) {
      dailyUsed = 0;
    }

    if (dailyUsed >= FREE_DAILY_LIMIT) {
      return { allowed: false, message: "今日免费次数已用完，明天再来或购买套餐" };
    }

    await env.DB.prepare(
      "UPDATE users SET free_daily_used = ?, free_daily_date = ?, updated_at = ? WHERE id = ?"
    ).bind(dailyUsed + 1, today, now(), user.id).run();

    return { allowed: true };
  }

  if (planType === "credits") {
    if ((user.credits || 0) <= 0) {
      return { allowed: false, message: "额度已用完，请购买更多额度" };
    }

    await env.DB.prepare(
      "UPDATE users SET credits = credits - 1, updated_at = ? WHERE id = ?"
    ).bind(now(), user.id).run();

    return { allowed: true };
  }

  if (planType === "subscription") {
    if (now() >= (user.subscription_end || 0)) {
      return { allowed: false, message: "订阅已过期，请续费" };
    }

    // 月初重置
    const resetDate = user.month_reset_date;
    const currentMonth = today.slice(0, 7);
    if (!resetDate || !resetDate.startsWith(currentMonth)) {
      await env.DB.prepare(
        "UPDATE users SET used_this_month = 0, month_reset_date = ? WHERE id = ?"
      ).bind(today, user.id).run();
      user.used_this_month = 0;
    }

    if ((user.used_this_month || 0) >= (user.monthly_quota || 0)) {
      return { allowed: false, message: "本月额度已用完，请升级套餐或等待下月重置" };
    }

    await env.DB.prepare(
      "UPDATE users SET used_this_month = used_this_month + 1, updated_at = ? WHERE id = ?"
    ).bind(now(), user.id).run();

    return { allowed: true };
  }

  return { allowed: false, message: "未知套餐类型" };
}

// ============================================================
// 格式化用户数据（返回前端）
// ============================================================
function formatUser(user) {
  const usage = calculateUsage(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    planType: user.plan_type || "free",
    planName: user.subscription_plan,
    credits: user.credits || 0,
    createdAt: user.created_at,
    usage,
  };
}

// ============================================================
// Buffer → Base64
// ============================================================
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// ============================================================
// PayPal API 工具
// ============================================================
const PAYPAL_SANDBOX_URL = "https://api-m.sandbox.paypal.com";
const PAYPAL_LIVE_URL = "https://api-m.paypal.com";

function getPaypalUrl(env) {
  return env.PAYPAL_MODE === "live" ? PAYPAL_LIVE_URL : PAYPAL_SANDBOX_URL;
}

async function getPaypalAccessToken(env) {
  const baseUrl = getPaypalUrl(env);
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("PayPal auth failed");
  return data.access_token;
}

// 按量包配置
const CREDIT_PACKS = {
  pro:  { name: "Pro",  price: "1.69", credits: 100 },
  enterprise300: { name: "Enterprise", price: "4.69", credits: 300 },
  enterprise800: { name: "Enterprise Plus", price: "9.69", credits: 800 },
};

// 月订阅配置（需要在 PayPal 后台创建 Plan，这里存 Plan ID）
const SUBSCRIPTION_PLANS = {
  basic_monthly: { name: "Basic Monthly", price: "2.99", credits: 250 },
  pro_monthly:   { name: "Pro Monthly",   price: "6.99", credits: 700 },
};

// ============================================================
// POST /api/paypal/create-order — 一次性支付（按量包）
// ============================================================
async function handlePaypalCreateOrder(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);

    const body = await request.json();
    const { planId } = body;
    const pack = CREDIT_PACKS[planId];
    if (!pack) return err("INVALID_PLAN", "无效的套餐", 400);

    const accessToken = await getPaypalAccessToken(env);
    const baseUrl = getPaypalUrl(env);

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: `${user.id}:${planId}:${now()}`,
          description: `Image BG Remover - ${pack.name}`,
          amount: {
            currency_code: "USD",
            value: pack.price,
          },
        }],
        application_context: {
          brand_name: "Image BG Remover",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${new URL(request.url).origin}/dashboard?payment=success`,
          cancel_url: `${new URL(request.url).origin}/dashboard?payment=cancel`,
        },
      }),
    });

    const order = await orderRes.json();
    if (!order.id) throw new Error("Failed to create PayPal order");

    // 记录订单到数据库
    await env.DB.prepare(
      `INSERT INTO orders (id, user_id, order_type, plan_name, amount, credits_added, payment_provider, payment_id, payment_status, created_at)
       VALUES (?, ?, 'credits', ?, ?, ?, 'paypal', ?, 'pending', ?)`
    ).bind(uuid(), user.id, planId, parseFloat(pack.price), pack.credits, order.id, now()).run();

    return json({
      success: true,
      data: {
        orderId: order.id,
        approveUrl: order.links?.find(l => l.rel === "approve")?.href,
      },
    });
  } catch (error) {
    console.error("create-order error:", error.message);
    return err("PAYPAL_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/paypal/capture-order — 确认支付（按量包）
// ============================================================
async function handlePaypalCaptureOrder(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);

    const body = await request.json();
    const { orderId } = body;
    if (!orderId) return err("NO_ORDER_ID", "缺少订单ID", 400);

    const accessToken = await getPaypalAccessToken(env);
    const baseUrl = getPaypalUrl(env);

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const capture = await captureRes.json();
    
    if (capture.status !== "COMPLETED") {
      return err("PAYMENT_FAILED", "支付未完成", 400);
    }

    // 查找订单
    const order = await env.DB.prepare(
      "SELECT * FROM orders WHERE payment_id = ? AND user_id = ?"
    ).bind(orderId, user.id).first();

    if (!order) return err("ORDER_NOT_FOUND", "订单不存在", 404);
    if (order.payment_status === "completed") {
      return json({ success: true, data: { message: "订单已处理", credits: user.credits } });
    }

    // 更新订单状态
    await env.DB.prepare(
      "UPDATE orders SET payment_status = 'completed', completed_at = ? WHERE payment_id = ?"
    ).bind(now(), orderId).run();

    // 给用户加额度
    await env.DB.prepare(
      "UPDATE users SET credits = credits + ?, plan_type = 'credits', subscription_plan = ?, updated_at = ? WHERE id = ?"
    ).bind(order.credits_added, order.plan_name, now(), user.id).run();

    const updatedUser = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();

    return json({
      success: true,
      data: {
        message: "支付成功！",
        creditsAdded: order.credits_added,
        totalCredits: updatedUser.credits,
      },
    });
  } catch (error) {
    console.error("capture-order error:", error.message);
    return err("PAYPAL_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/paypal/create-subscription — 月订阅
// ============================================================
async function handlePaypalCreateSubscription(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);

    const body = await request.json();
    const { planId } = body;
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return err("INVALID_PLAN", "无效的订阅套餐", 400);

    // 获取 PayPal Plan ID（需要预先在 PayPal 创建）
    const paypalPlanId = env[`PAYPAL_PLAN_${planId.toUpperCase()}`];
    if (!paypalPlanId) {
      return err("PLAN_NOT_CONFIGURED", "订阅套餐未配置，请联系管理员", 500);
    }

    const accessToken = await getPaypalAccessToken(env);
    const baseUrl = getPaypalUrl(env);

    const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: paypalPlanId,
        subscriber: {
          name: { given_name: user.name || "User" },
          email_address: user.email,
        },
        application_context: {
          brand_name: "Image BG Remover",
          locale: "en-US",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${new URL(request.url).origin}/dashboard?subscription=success&plan=${planId}`,
          cancel_url: `${new URL(request.url).origin}/dashboard?subscription=cancel`,
        },
        custom_id: `${user.id}:${planId}`,
      }),
    });

    const subscription = await subRes.json();
    if (!subscription.id) throw new Error("Failed to create subscription");

    return json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        approveUrl: subscription.links?.find(l => l.rel === "approve")?.href,
      },
    });
  } catch (error) {
    console.error("create-subscription error:", error.message);
    return err("PAYPAL_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/paypal/cancel-subscription — 取消订阅
// ============================================================
async function handlePaypalCancelSubscription(request, env) {
  try {
    const { user } = await getUser(request, env);
    if (!user) return err("UNAUTHORIZED", "请先登录", 401);

    const subId = user.paypal_subscription_id;
    if (!subId) return err("NO_SUBSCRIPTION", "没有活跃订阅", 400);

    const accessToken = await getPaypalAccessToken(env);
    const baseUrl = getPaypalUrl(env);

    await fetch(`${baseUrl}/v1/billing/subscriptions/${subId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "User requested cancellation" }),
    });

    // 更新用户状态（保留到期日前的额度）
    await env.DB.prepare(
      "UPDATE users SET paypal_subscription_id = NULL, updated_at = ? WHERE id = ?"
    ).bind(now(), user.id).run();

    return json({ success: true, data: { message: "订阅已取消" } });
  } catch (error) {
    console.error("cancel-subscription error:", error.message);
    return err("PAYPAL_ERROR", error.message, 500);
  }
}

// ============================================================
// POST /api/paypal/webhook — PayPal 回调
// ============================================================
async function handlePaypalWebhook(request, env) {
  try {
    const body = await request.json();
    const eventType = body.event_type;
    const resource = body.resource;

    console.log("PayPal webhook:", eventType, JSON.stringify(resource?.id));

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const customId = resource.custom_id; // "userId:planId"
        const [userId, planId] = (customId || "").split(":");
        const plan = SUBSCRIPTION_PLANS[planId];
        
        if (userId && plan) {
          const subEnd = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30天后
          await env.DB.prepare(
            `UPDATE users SET 
              plan_type = 'subscription', 
              subscription_plan = ?, 
              monthly_quota = ?, 
              used_this_month = 0, 
              month_reset_date = ?,
              subscription_start = ?, 
              subscription_end = ?,
              paypal_subscription_id = ?,
              updated_at = ? 
            WHERE id = ?`
          ).bind(planId, plan.credits, todayStr(), now(), subEnd, resource.id, now(), userId).run();
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        const subId = resource.id;
        await env.DB.prepare(
          "UPDATE users SET paypal_subscription_id = NULL, updated_at = ? WHERE paypal_subscription_id = ?"
        ).bind(now(), subId).run();
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        // 订阅续费成功，重置月额度
        const subId = resource.billing_agreement_id;
        if (subId) {
          const user = await env.DB.prepare(
            "SELECT * FROM users WHERE paypal_subscription_id = ?"
          ).bind(subId).first();

          if (user) {
            const subEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;
            await env.DB.prepare(
              `UPDATE users SET 
                used_this_month = 0, 
                month_reset_date = ?,
                subscription_end = ?,
                updated_at = ? 
              WHERE id = ?`
            ).bind(todayStr(), subEnd, now(), user.id).run();
          }
        }
        break;
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error("webhook error:", error.message);
    return json({ success: true }); // 必须返回 200，否则 PayPal 会重试
  }
}
