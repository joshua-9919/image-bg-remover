"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "ibr_cookie_consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reopen = () => setVisible(true);
    window.addEventListener("ibr:open-cookie-settings", reopen);
    let hasChoice = false;
    try {
      hasChoice = localStorage.getItem(CONSENT_KEY) !== null;
    } catch (e) {
      hasChoice = false;
    }
    if (!hasChoice) {
      setVisible(true);
    }
    return () => window.removeEventListener("ibr:open-cookie-settings", reopen);
  }, []);

  const choose = (value: "granted" | "denied") => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {
      // Storage unavailable; the choice applies only until the next full page load.
    }
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: value });
    }
    if (value === "denied") {
      // Remove any GA cookies set by an earlier Accept.
      const host = window.location.hostname;
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        if (name === "_ga" || name.startsWith("_ga_")) {
          [host, "." + host, "." + host.replace(/^www\./, "")].forEach((d) => {
            document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`;
          });
          document.cookie = `${name}=; Max-Age=0; path=/`;
        }
      });
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-gray-600">
          We use Google Analytics cookies for aggregate analytics only if you accept.{" "}
          <Link href="/privacy" className="font-medium text-purple-700 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-purple-300"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
