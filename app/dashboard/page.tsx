"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Image from "next/image";

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎨</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Image BG Remover</h1>
                <p className="text-sm text-gray-600">用户中心</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {session?.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-purple-200"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{session?.user?.name || "用户"}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email || ""}</p>
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="px-4 py-2 text-sm text-gray-600 hover:text-purple-600 transition-colors">
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">我的历史记录</h2>
          <p className="text-gray-600">查看和下载您处理过的图片</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">还没有历史记录</h3>
          <p className="text-gray-600 mb-6">登录后处理的图片会保存在这里</p>
          <a href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all">
            <span>📤</span>
            <span>去处理图片</span>
          </a>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
