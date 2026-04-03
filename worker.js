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

    // 静态文件
    return env.ASSETS.fetch(request);
  },
};

// ============================================================
// CORS
// ============================================================
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

// 从请求获取当前用户（通过 session token）
async function getUser(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);

  // 从 KV 获取 session
  const sessionData = await env.SESSIONS.get(token);
  if (!sessionData) return null;

  const session = JSON.parse(sessionData);
  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.userId).first();
  return user;
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
  basic_monthly: { name: "Basic",  type: "subscription", price: 2.99, credits: 250 },
  pro_monthly:   { name: "Pro",    type: "subscription", price: 6.99, credits: 700 },
};

const FREE_TRIAL_DAYS = 7;
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
  const user = await getUser(request, env);
  if (!user) return err("UNAUTHORIZED", "请先登录", 401);
  return json({ success: true, data: formatUser(user) });
}

// ============================================================
// GET /api/user/usage — 获取额度信息
// ============================================================
async function handleGetUsage(request, env) {
  const user = await getUser(request, env);
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

  return json({
    success: true,
    data: {
      ...usage,
      todayUsed: todayCount?.cnt || 0,
      monthUsed: monthCount?.cnt || 0,
    },
  });
}

// ============================================================
// GET /api/user/history — 处理历史
// ============================================================
async function handleGetHistory(request, env) {
  const user = await getUser(request, env);
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
        { id: "basic_monthly", name: "Basic", price: 2.99, credits: 250, period: "month", perImage: "$0.012" },
        { id: "pro_monthly", name: "Pro", price: 6.99, credits: 700, period: "month", perImage: "$0.010", popular: true },
      ],
      free: {
        guestLimit: GUEST_LIMIT,
        dailyLimit: FREE_DAILY_LIMIT,
        trialDays: FREE_TRIAL_DAYS,
      },
    },
  });
}

// ============================================================
// POST /api/remove — 去背景（含额度检查）
// ============================================================
async function handleRemoveBg(request, env) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return err("NO_FILE", "请上传图片文件", 400);
    }

    // 获取用户（可能未登录）
    const user = await getUser(request, env);

    // 额度检查
    if (user) {
      const canUse = await checkAndDeductCredits(user, env);
      if (!canUse.allowed) {
        return err("QUOTA_EXCEEDED", canUse.message, 403);
      }
    } else {
      // 未登录：检查 guest 额度（通过 IP）
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const guestKey = `guest:${ip}`;
      const guestData = await env.SESSIONS.get(guestKey);
      const guest = guestData ? JSON.parse(guestData) : { count: 0 };

      if (guest.count >= GUEST_LIMIT) {
        return err("GUEST_LIMIT", "免费试用已用完，请注册登录获得更多额度", 403);
      }

      guest.count++;
      await env.SESSIONS.put(guestKey, JSON.stringify(guest), { expirationTtl: 60 * 60 * 24 * 365 });
    }

    // 调用 RemoveBG API
    const apiKey = env.REMOVEBG_API_KEY;
    if (!apiKey) {
      return err("API_ERROR", "服务配置错误", 500);
    }

    const startTime = now();
    const removeBgFormData = new FormData();
    removeBgFormData.append("image_file", imageFile);

    const apiResponse = await fetch("https://removebgapi.com/api/v1/remove", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
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

    // 记录使用日志
    if (user) {
      await env.DB.prepare(
        "INSERT INTO usage_logs (id, user_id, action, credits_used, created_at) VALUES (?, ?, 'remove_bg', 1, ?)"
      ).bind(uuid(), user.id, now()).run();

      // 记录到 image_history
      await env.DB.prepare(
        "INSERT INTO image_history (id, user_id, file_name, file_size, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(uuid(), user.id, imageFile.name || "image.png", imageFile.size || 0, now()).run();
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
