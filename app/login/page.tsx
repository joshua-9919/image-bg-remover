"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, getLocale, t } from "../../lib/i18n";
import LanguageSwitcher from "../../components/LanguageSwitcher";

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
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/dashboard");
      return;
    }

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
          locale: locale === "zh-CN" ? "zh_CN" : locale === "zh-TW" ? "zh_TW" : locale,
        }
      );
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [router, locale]);

  async function handleCredentialResponse(response: any) {
    setIsLoggingIn(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || t(locale, "login.error"));

      localStorage.setItem("auth_token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "login.error"));
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Language Switcher - Top Right */}
      <div className="fixed top-4 right-4 z-20">
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </div>

      <div className="w-full max-w-md px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-4 shadow-lg">
              <span className="text-4xl">🎨</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t(locale, "login.title")}
            </h1>
            <p className="text-gray-600">
              {t(locale, "login.subtitle")}
            </p>
          </div>

          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span> {t(locale, "login.benefit1")}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span> {t(locale, "login.benefit2")}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span> {t(locale, "login.benefit3")}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-6">
            {(isLoading || isLoggingIn) && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-[360px] h-[44px] bg-gray-100 rounded-full animate-pulse"></div>
                {isLoggingIn && <p className="text-sm text-gray-500">{t(locale, "login.loading")}</p>}
              </div>
            )}
            <div id="google-signin-btn" style={{ display: isLoggingIn ? "none" : "block" }}></div>
          </div>

          <div className="text-center">
            <a href="/" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
              {t(locale, "login.back")}
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              {t(locale, "login.security")}<br />
              {t(locale, "login.security2")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
