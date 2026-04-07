"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, getLocale, t } from "../../lib/i18n";
import LanguageSwitcher from "../../components/LanguageSwitcher";

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  planType: string;
  planName: string;
  credits: number;
  usage: {
    planType: string;
    remaining: number;
    message: string;
    dailyLimit?: number;
    dailyUsed?: number;
    daysLeft?: number;
    trialExpired?: boolean;
    monthlyQuota?: number;
    usedThisMonth?: number;
    isActive?: boolean;
  };
}

interface HistoryRecord {
  id: string;
  file_name: string;
  file_size: number;
  created_at: number;
}

interface UsageData {
  planType: string;
  remaining: number;
  message: string;
  todayUsed: number;
  monthUsed: number;
  dailyLimit?: number;
  dailyUsed?: number;
  daysLeft?: number;
  trialExpired?: boolean;
  monthlyQuota?: number;
  usedThisMonth?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "plans">("overview");
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData(token);
  }, [router]);

  async function loadData(token: string) {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, usageRes, historyRes] = await Promise.all([
        fetch("/api/user/profile", { headers }),
        fetch("/api/user/usage", { headers }),
        fetch("/api/user/history?limit=10", { headers }),
      ]);

      if (profileRes.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      const profileData = await profileRes.json();
      const usageData = await usageRes.json();
      const historyData = await historyRes.json();

      if (profileData.success) setUser(profileData.data);
      if (usageData.success) setUsage(usageData.data);
      if (historyData.success) {
        setHistory(historyData.data.records);
        setHistoryTotal(historyData.data.total);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    if ((window as any).google) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="text-3xl">🎨</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{t(locale, "app.name")}</h1>
                <p className="text-sm text-gray-600">{t(locale, "nav.dashboard")}</p>
              </div>
            </a>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-purple-200"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <LanguageSwitcher locale={locale} onChange={setLocale} />
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                {t(locale, "nav.signout")}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {t(locale, "dash.welcome", { name: user.name })}
          </h2>
          <p className="text-gray-600">{usage?.message || t(locale, "app.tagline")}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/60 p-1 rounded-xl border border-gray-200 w-fit">
          {[
            { key: "overview", label: t(locale, "dash.tab.overview"), },
            { key: "history", label: t(locale, "dash.tab.history"), },
            { key: "plans", label: t(locale, "dash.tab.plans"), },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white shadow-sm text-purple-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 当前套餐 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">💎</div>
                  <div>
                    <p className="text-sm text-gray-500">{t(locale, "dash.plan")}</p>
                    <p className="text-lg font-bold text-gray-800">
                      {user.planType === "free" ? t(locale, "dash.plan.free") :
                       user.planType === "credits" ? t(locale, "dash.plan.credits") : t(locale, "dash.plan.subscription")}
                    </p>
                  </div>
                </div>
                {user.planType === "free" && usage?.daysLeft !== undefined && (
                  <div className="text-sm text-gray-600">
                    {usage.trialExpired ? (
                      <span className="text-red-500 font-medium">{t(locale, "dash.trial.expired")}</span>
                    ) : (
                      <span>{t(locale, "dash.trial.days").replace("{days}", "")} <span className="font-bold text-purple-600">{usage.daysLeft}</span> {t(locale, "dash.trial.days").split(" ").pop()}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 剩余额度 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">🎯</div>
                  <div>
                    <p className="text-sm text-gray-500">{t(locale, "dash.remaining")}</p>
                    <p className="text-lg font-bold text-gray-800">
                      {usage?.remaining ?? 0} {t(locale, "dash.remaining.unit")}
                    </p>
                  </div>
                </div>
                {user.planType === "free" && usage && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${((usage.dailyUsed || 0) / (usage.dailyLimit || 3)) * 100}%` }}
                    ></div>
                  </div>
                )}
                {user.planType === "subscription" && usage && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${((usage.usedThisMonth || 0) / (usage.monthlyQuota || 1)) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* 已处理 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📷</div>
                  <div>
                    <p className="text-sm text-gray-500">{t(locale, "dash.processed")}</p>
                    <p className="text-lg font-bold text-gray-800">{historyTotal} {t(locale, "dash.remaining.unit")}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {t(locale, "dash.today")} {usage?.todayUsed || 0} {t(locale, "dash.remaining.unit")} · {t(locale, "dash.month")} {usage?.monthUsed || 0} {t(locale, "dash.remaining.unit")}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t(locale, "dash.quick")}</h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all"
                >
                  {t(locale, "dash.btn.process")}
                </a>
                {(user.planType === "free" || usage?.remaining === 0) && (
                  <button
                    onClick={() => setActiveTab("plans")}
                    className="inline-flex items-center gap-2 bg-white text-purple-600 font-semibold py-3 px-6 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all"
                  >
                    {t(locale, "dash.btn.upgrade")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100">
            {history.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t(locale, "dash.history.empty")}</h3>
                <p className="text-gray-600 mb-6">{t(locale, "dash.history.empty.desc")}</p>
                <a href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl">
                  {t(locale, "dash.btn.process")}
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="px-6 py-4 bg-gray-50/50 rounded-t-2xl">
                  <p className="text-sm font-medium text-gray-600">{t(locale, "dash.history.total", { count: String(historyTotal) })}</p>
                </div>
                {history.map((record) => (
                  <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">🖼️</div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{record.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.created_at).toLocaleString(locale === "zh-CN" ? "zh-CN" : locale)} · {formatFileSize(record.file_size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && <PlansSection currentPlan={user.planType} locale={locale} />}
      </main>
    </div>
  );
}

// ============================================================
// Plans Section Component (with PayPal)
// ============================================================
function PlansSection({ currentPlan, locale }: { currentPlan: string; locale: Locale }) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleBuyPack(planId: string) {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setPurchasing(planId);
    setMessage(null);

    try {
      // 1. 创建订单
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to create order");

      // 2. 跳转 PayPal 支付
      if (data.data.approveUrl) {
        window.location.href = data.data.approveUrl;
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Purchase failed" });
      setPurchasing(null);
    }
  }

  async function handleSubscribe(planId: string) {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setPurchasing(planId);
    setMessage(null);

    try {
      const res = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Failed to create subscription");

      if (data.data.approveUrl) {
        window.location.href = data.data.approveUrl;
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Subscription failed" });
      setPurchasing(null);
    }
  }

  // 检查 URL 参数处理支付回调
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const subscription = params.get("subscription");
    const paypalOrderId = params.get("token"); // PayPal 回调带的 token 就是 order ID

    if (payment === "success" && paypalOrderId) {
      // 确认支付
      const token = localStorage.getItem("auth_token");
      if (token) {
        fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: paypalOrderId }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              setMessage({ type: "success", text: `Payment successful! ${data.data.creditsAdded} credits added.` });
            } else {
              setMessage({ type: "error", text: data.error?.message || "Payment confirmation failed" });
            }
          })
          .catch(() => setMessage({ type: "error", text: "Payment confirmation failed" }));
      }
      // 清除 URL 参数
      window.history.replaceState({}, "", "/dashboard");
    } else if (payment === "cancel") {
      setMessage({ type: "error", text: "支付已取消" });
      window.history.replaceState({}, "", "/dashboard");
    } else if (subscription === "success") {
      setMessage({ type: "success", text: "Subscription activated! Credits will be added shortly." });
      window.history.replaceState({}, "", "/dashboard");
    } else if (subscription === "cancel") {
      setMessage({ type: "error", text: "Subscription cancelled" });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Message */}
      {message && (
        <div className={`rounded-2xl p-4 text-center ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Credit Packs */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">💰 Credit Packs</h3>
        <p className="text-sm text-gray-600 mb-4">Never expire, buy more when you run out</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "pro", name: "Pro", price: "$1.69", credits: "100", per: "$0.017/image" },
            { id: "enterprise300", name: "Enterprise", price: "$4.69", credits: "300", per: "$0.016/image", popular: true },
            { id: "enterprise800", name: "Enterprise Plus", price: "$9.69", credits: "800", per: "$0.012/image", best: true },
          ].map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
                plan.popular ? "border-purple-400 shadow-md" : "border-gray-100"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              {plan.best && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Best Value
                </div>
              )}
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-800">{plan.name}</h4>
                <div className="text-3xl font-bold text-purple-600 my-3">{plan.price}</div>
                <p className="text-gray-600 font-medium">{plan.credits} images</p>
                <p className="text-sm text-gray-500 mt-1">{plan.per}</p>
                <button
                  onClick={() => handleBuyPack(plan.id)}
                  disabled={purchasing === plan.id}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purchasing === plan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">📅 Monthly Subscriptions</h3>
        <p className="text-sm text-gray-600 mb-4">Monthly billing, credits reset each month</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "basic_monthly", name: "Basic", price: "$2.99", credits: "250", per: "$0.012/image", period: "/mo" },
            { id: "pro_monthly", name: "Pro", price: "$6.99", credits: "700", per: "$0.010/image", period: "/mo", popular: true },
          ].map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
                plan.popular ? "border-purple-400 shadow-md" : "border-gray-100"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-800">{plan.name}</h4>
                <div className="my-3">
                  <span className="text-3xl font-bold text-purple-600">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-gray-600 font-medium">{plan.credits} images/month</p>
                <p className="text-sm text-gray-500 mt-1">{plan.per}</p>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={purchasing === plan.id}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purchasing === plan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
                      Subscribe
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 text-center">
        <p className="text-sm text-blue-700">
          🔒 Payments securely processed by PayPal · Credit packs never expire · Cancel subscription anytime
        </p>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "未知";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}
