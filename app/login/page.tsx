"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_CLIENT_ID = "923683353586-gd8aoemj92jc3t6cbs44da8iqnipvc70.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 已登录则跳转
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/dashboard");
      return;
    }

    // 加载 Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        {
          theme: "outline",
          size: "large",
          width: 360,
          text: "signin_with",
          shape: "pill",
          logo_alignment: "center",
        }
      );
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [router]);

  async function handleCredentialResponse(response: any) {
    setIsLoggingIn(true);
    setError(null);

    try {
      // 发送 credential 到后端验证并创建用户
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "登录失败");
      }

      // 保存 token 和用户信息
      localStorage.setItem("auth_token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请重试");
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-4 shadow-lg">
              <span className="text-4xl">🎨</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Image BG Remover
            </h1>
            <p className="text-gray-600">
              登录后享受更多功能
            </p>
          </div>

          {/* 登录优势 */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span> 每天 3 次免费去背景（7天试用）
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span> 保存处理历史，随时下载
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span> 解锁更多套餐和额度
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-6">
            {(isLoading || isLoggingIn) ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-[360px] h-[44px] bg-gray-100 rounded-full animate-pulse"></div>
                {isLoggingIn && <p className="text-sm text-gray-500">正在登录...</p>}
              </div>
            ) : null}
            <div id="google-signin-btn" style={{ display: isLoggingIn ? "none" : "block" }}></div>
          </div>

          <div className="text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
              ← 返回首页，继续免费使用
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              使用 Google 账号安全登录<br />
              我们不会获取您的密码
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
