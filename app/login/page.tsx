"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_CLIENT_ID = "923683353586-gd8aoemj92jc3t6cbs44da8iqnipvc70.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 已登录则跳转
    const saved = localStorage.getItem("user");
    if (saved) {
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

  function handleCredentialResponse(response: any) {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    const user: User = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      image: payload.picture,
    };
    localStorage.setItem("user", JSON.stringify(user));
    router.push("/dashboard");
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
              登录以保存您的历史记录
            </p>
          </div>

          <div className="flex justify-center mb-6">
            {isLoading ? (
              <div className="w-[360px] h-[44px] bg-gray-100 rounded-full animate-pulse"></div>
            ) : null}
            <div id="google-signin-btn"></div>
          </div>

          <div className="text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
              ← 返回首页，继续使用
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              登录后可以保存您的处理历史，<br/>
              随时查看和下载之前的图片
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
