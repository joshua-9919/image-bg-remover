"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale, getLocale, t } from "../lib/i18n";

const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/pricing", labelKey: "nav.pricing" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/contact", labelKey: "nav.contact" },
];

const legalLinks = [
  { href: "/privacy", labelKey: "nav.privacy" },
  { href: "/terms", labelKey: "nav.terms" },
  { href: "/refund", labelKey: "nav.refund" },
];

export function SiteHeader() {
  const [locale, setLocale] = useState<Locale>("en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setLocale(getLocale());
    setIsLoggedIn(Boolean(localStorage.getItem("auth_token")));
  }, []);

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-bold leading-tight text-gray-900">
          <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span>Image BG Remover</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium sm:gap-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap text-gray-600 transition-colors hover:text-purple-700">
              {t(locale, link.labelKey)}
            </Link>
          ))}
          <LanguageSwitcher locale={locale} onChange={setLocale} />
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="whitespace-nowrap rounded-lg bg-purple-600 px-3 py-2 text-white transition-colors hover:bg-purple-700 sm:px-4">
            {isLoggedIn ? t(locale, "nav.account") : t(locale, "nav.login")}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  return (
    <footer className="mt-20 border-t border-gray-100 bg-white/70">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-purple-700">
              {t(locale, link.labelKey)}
            </Link>
          ))}
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-purple-700">
              {t(locale, link.labelKey)}
            </Link>
          ))}
        </div>
        <p className="mt-5 text-center">© 2026 Image BG Remover. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}

export function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="border-b border-gray-100 bg-white/70">
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">{subtitle}</p>
      </div>
    </section>
  );
}

export function ContentSection({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="space-y-6 text-base leading-7 text-gray-700">{children}</div>
    </section>
  );
}
