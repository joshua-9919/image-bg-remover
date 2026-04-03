"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
                <h1 className="text-xl font-bold text-gray-800">Image BG Remover</h1>
                <p className="text-sm text-gray-600">用户中心</p>
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
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                退出
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
            你好，{user.name} 👋
          </h2>
          <p className="text-gray-600">{usage?.message || "欢迎使用 Image BG Remover"}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/60 p-1 rounded-xl border border-gray-200 w-fit">
          {[
            { key: "overview", label: "📊 总览", },
            { key: "history", label: "🖼️ 历史", },
            { key: "plans", label: "💎 套餐", },
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
                    <p className="text-sm text-gray-500">当前套餐</p>
                    <p className="text-lg font-bold text-gray-800">
                      {user.planType === "free" ? "免费试用" :
                       user.planType === "credits" ? "按量包" : "月订阅"}
                    </p>
                  </div>
                </div>
                {user.planType === "free" && usage?.daysLeft !== undefined && (
                  <div className="text-sm text-gray-600">
                    {usage.trialExpired ? (
                      <span className="text-red-500 font-medium">试用已到期</span>
                    ) : (
                      <span>剩余 <span className="font-bold text-purple-600">{usage.daysLeft}</span> 天</span>
                    )}
                  </div>
                )}
              </div>

              {/* 剩余额度 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">🎯</div>
                  <div>
                    <p className="text-sm text-gray-500">剩余额度</p>
                    <p className="text-lg font-bold text-gray-800">
                      {usage?.remaining ?? 0} 张
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
                    <p className="text-sm text-gray-500">已处理图片</p>
                    <p className="text-lg font-bold text-gray-800">{historyTotal} 张</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  今日 {usage?.todayUsed || 0} 张 · 本月 {usage?.monthUsed || 0} 张
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all"
                >
                  📤 去处理图片
                </a>
                {(user.planType === "free" || usage?.remaining === 0) && (
                  <button
                    onClick={() => setActiveTab("plans")}
                    className="inline-flex items-center gap-2 bg-white text-purple-600 font-semibold py-3 px-6 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all"
                  >
                    💎 升级套餐
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
                <h3 className="text-xl font-semibold text-gray-800 mb-2">还没有历史记录</h3>
                <p className="text-gray-600 mb-6">处理的图片会自动保存在这里</p>
                <a href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl">
                  📤 去处理图片
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="px-6 py-4 bg-gray-50/50 rounded-t-2xl">
                  <p className="text-sm font-medium text-gray-600">共 {historyTotal} 条记录</p>
                </div>
                {history.map((record) => (
                  <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">🖼️</div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{record.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.created_at).toLocaleString("zh-CN")} · {formatFileSize(record.file_size)}
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
        {activeTab === "plans" && <PlansSection currentPlan={user.planType} />}
      </main>
    </div>
  );
}

// ============================================================
// Plans Section Component
// ============================================================
function PlansSection({ currentPlan }: { currentPlan: string }) {
  return (
    <div className="space-y-8">
      {/* Credit Packs */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">💰 按量包</h3>
        <p className="text-sm text-gray-600 mb-4">买了不过期，用完再买</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Starter", price: "$1.69", credits: "100", per: "$0.017/张" },
            { name: "Standard", price: "$4.69", credits: "300", per: "$0.016/张", popular: true },
            { name: "Pro Pack", price: "$9.69", credits: "800", per: "$0.012/张", best: true },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
                plan.popular ? "border-purple-400 shadow-md" : "border-gray-100"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  最受欢迎
                </div>
              )}
              {plan.best && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  最划算
                </div>
              )}
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-800">{plan.name}</h4>
                <div className="text-3xl font-bold text-purple-600 my-3">{plan.price}</div>
                <p className="text-gray-600 font-medium">{plan.credits} 张额度</p>
                <p className="text-sm text-gray-500 mt-1">{plan.per}</p>
                <button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:shadow-lg transition-all">
                  购买
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">📅 月订阅</h3>
        <p className="text-sm text-gray-600 mb-4">按月付费，每月重置额度</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Basic", price: "$2.99", credits: "250", per: "$0.012/张", period: "/月" },
            { name: "Pro", price: "$6.99", credits: "700", per: "$0.010/张", period: "/月", popular: true },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
                plan.popular ? "border-purple-400 shadow-md" : "border-gray-100"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  推荐
                </div>
              )}
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-800">{plan.name}</h4>
                <div className="my-3">
                  <span className="text-3xl font-bold text-purple-600">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-gray-600 font-medium">{plan.credits} 张/月</p>
                <p className="text-sm text-gray-500 mt-1">{plan.per}</p>
                <button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:shadow-lg transition-all">
                  订阅
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 text-center">
        <p className="text-sm text-blue-700">
          🔒 支付由 PayPal 安全处理 · 按量包永不过期 · 订阅可随时取消
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
