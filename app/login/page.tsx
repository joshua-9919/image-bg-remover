"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 border-2 border-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>登录中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.766 12.2764c0-.8922-.0764-1.7583-.2213-2.5985H12.001v4.911h6.6994c-.2906 1.5443-1.1638 2.846-2.4738 3.7291v3.2428h4.0083c2.3538-2.1678 3.7187-5.3678 3.5311-9.2844z"/>
                  <path fill="#34A853" d="M12.001 24.0004c3.3556 0 6.1767-1.1108 8.2339-3.0098l-4.0083-3.2428c-1.114.7477-2.541 1.1885-4.2256 1.1885-3.2363 0-5.9806-2.1896-6.9605-5.1208H.903v3.3598C2.9387 21.2377 7.2103 24.0004 12.001 24.0004z"/>
                  <path fill="#FBBC05" d="M5.0405 13.8163c-.2448-.726-.3835-1.5043-.3835-2.3159 0-.8116.1387-1.5899.3835-2.3159V5.8247H.903C.3247 6.9764 0 8.2764 0 9.6484s.3247 2.672.903 3.8236l4.1375-3.2557z"/>
                  <path fill="#EA4335" d="M12.001 4.7273c1.8266 0 3.4656.6285 4.7638 1.8548l3.567-3.567C18.1766 1.043 15.3556 0 12.001 0 7.2103 0 2.9387 2.7627.903 6.8236l4.1375 3.2557c.9799-2.9312 3.7242-5.1208 6.9605-5.1208z"/>
                </svg>
                <span>使用 Google 账号登录</span>
              </>
            )}
          </button>

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
