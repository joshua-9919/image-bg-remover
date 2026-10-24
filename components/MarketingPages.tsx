"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContentSection, PageHero, SiteShell } from "./SiteShell";
import { Locale, getLocale } from "../lib/i18n";

function isChinese(locale: Locale) {
  return locale === "zh-CN" || locale === "zh-TW";
}

function useMarketingLocale() {
  const [locale, setLocale] = useState<Locale>("en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setLocale(getLocale());
    setIsLoggedIn(Boolean(localStorage.getItem("auth_token")));
  }, []);

  return { locale, isLoggedIn, zh: isChinese(locale) };
}

const creditPacks = [
  { name: "Starter", price: "$1.69", credits: "100 images", creditsZh: "100 张", detail: "$0.017 per image", detailZh: "约 $0.017 / 张" },
  { name: "Standard", price: "$4.69", credits: "300 images", creditsZh: "300 张", detail: "$0.016 per image", detailZh: "约 $0.016 / 张", badge: "Popular", badgeZh: "热门" },
  { name: "Pro Pack", price: "$9.69", credits: "800 images", creditsZh: "800 张", detail: "$0.012 per image", detailZh: "约 $0.012 / 张", badge: "Best value", badgeZh: "最划算" },
];

const subscriptions = [
  { name: "Basic", price: "$9.99/mo", credits: "1,000 images/month", creditsZh: "每月 1,000 张", detail: "Monthly credits reset each billing cycle", detailZh: "额度按账单周期每月重置" },
  { name: "Pro", price: "$19.99/mo", credits: "2,000 images/month", creditsZh: "每月 2,000 张", detail: "For higher-volume stores and API workflows", detailZh: "适合更高频的店铺图片和 API 工作流", badge: "Recommended", badgeZh: "推荐" },
];

export function PricingContent() {
  const { isLoggedIn, zh } = useMarketingLocale();

  return (
    <SiteShell>
      <PageHero
        title={zh ? "定价" : "Pricing"}
        subtitle={zh
          ? "游客可免费试用 3 张。登录后可享 3 天网页免费试用，每天 3 张；API 试用为每天 30 次，共 5 天。"
          : "Start with 3 guest removals. Sign in for a 3-day free trial with 3 web removals per day, plus API trial access at 30 requests per day for 5 days."
        }
      />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900">{zh ? "按量包" : "Credit packs"}</h2>
        <p className="mt-2 text-gray-600">{zh ? "一次性 PayPal 购买。只有成功去背景后才会消耗额度。" : "One-time PayPal purchase. Credits are used only when a background removal succeeds."}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {creditPacks.map((plan) => (
            <div key={plan.name} className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              {plan.badge && <span className="absolute right-4 top-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">{zh ? plan.badgeZh : plan.badge}</span>}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-4 text-3xl font-bold text-purple-700">{plan.price}</p>
              <p className="mt-2 font-medium text-gray-800">{zh ? plan.creditsZh : plan.credits}</p>
              <p className="mt-1 text-sm text-gray-500">{zh ? plan.detailZh : plan.detail}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-gray-900">{zh ? "月订阅" : "Monthly subscriptions"}</h2>
        <p className="mt-2 text-gray-600">{zh ? "月订阅适合重复处理商品图片和 API 使用。" : "Monthly plans are best for repeat ecommerce workflows and API usage."}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {subscriptions.map((plan) => (
            <div key={plan.name} className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              {plan.badge && <span className="absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{zh ? plan.badgeZh : plan.badge}</span>}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-4 text-3xl font-bold text-purple-700">{plan.price}</p>
              <p className="mt-2 font-medium text-gray-800">{zh ? plan.creditsZh : plan.credits}</p>
              <p className="mt-1 text-sm text-gray-500">{zh ? plan.detailZh : plan.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg bg-blue-50 p-5 text-sm leading-6 text-blue-900">
          {zh
            ? "支付由 PayPal 处理。订阅可在用户中心取消。扣款失败、重复购买或退款问题，请通过联系页面提交。"
            : "Payments are processed by PayPal. You can cancel subscriptions from your dashboard. For failed charges, duplicate purchases, or refund requests, contact us from the support page."
          }
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700">
            {isLoggedIn ? (zh ? "去用户中心购买" : "Go to dashboard to buy") : (zh ? "登录后购买" : "Sign in to buy")}
          </Link>
          <Link href="/refund" className="rounded-lg border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 hover:border-purple-300">
            {zh ? "退款政策" : "Refund policy"}
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

export function BlogContent() {
  const { zh } = useMarketingLocale();

  return (
    <SiteShell>
      <PageHero
        title={zh ? "博客" : "Blog"}
        subtitle={zh ? "商品图、跨境电商和去背景工作流的实用指南。" : "Practical guides for product photos, ecommerce workflows, and background removal."}
      />
      <section className="mx-auto max-w-4xl px-4 py-12">
        <article className="rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-purple-700">{zh ? "指南 · 2026 年 6 月 15 日" : "Guides · June 15, 2026"}</p>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            <Link href="/blog/remove-background-amazon" className="hover:text-purple-700">
              {zh ? "Amazon 卖家如何移除商品图背景" : "How to Remove Background from Product Photos for Amazon Sellers"}
            </Link>
          </h2>
          <p className="mt-3 leading-7 text-gray-600">
            {zh ? "一个从上传商品图、导出透明 PNG，到制作纯白背景主图的实用流程。" : "A step-by-step workflow for creating clean product images with transparent PNG output and a pure white final background."}
          </p>
          <Link href="/blog/remove-background-amazon" className="mt-5 inline-flex font-semibold text-purple-700 hover:text-purple-900">
            {zh ? "阅读指南" : "Read guide"}
          </Link>
        </article>
      </section>
    </SiteShell>
  );
}

export function AmazonGuideContent() {
  const { zh } = useMarketingLocale();

  return (
    <SiteShell>
      <PageHero
        title={zh ? "Amazon 卖家如何移除商品图背景" : "How to Remove Background from Product Photos for Amazon Sellers"}
        subtitle={zh ? "快速生成透明 PNG，再按平台要求放到纯白背景中。" : "Create a transparent PNG quickly, then place it on a pure white background before publishing your marketplace image."}
      />
      <ContentSection>
        <p>{zh ? "清晰的商品图能帮助买家快速理解产品。实际流程很简单：先移除原背景，导出透明 PNG，再按平台要求放到纯白画布上。" : "Clean product photos help shoppers understand the item quickly. For marketplace main images, the practical workflow is simple: remove the original background, export a transparent PNG, then place the product on a pure white canvas if that marketplace requires it."}</p>
        <h2 className="text-2xl font-bold text-gray-900">{zh ? "第 1 步：准备商品图" : "Step 1: Prepare the product photo"}</h2>
        <p>{zh ? "使用 5MB 以内的 JPG、PNG 或 WebP。光线清楚、边缘明显的图片通常效果更好。" : "Use a JPG, PNG, or WebP file under 5MB. Good lighting and a clear product edge usually produce a better result, especially for reflective products, transparent packaging, hair, or fur."}</p>
        <h2 className="text-2xl font-bold text-gray-900">{zh ? "第 2 步：移除背景" : "Step 2: Remove the background"}</h2>
        <p>{zh ? "上传图片到 Image BG Remover，运行 AI 去背景，然后下载透明 PNG。游客可先试用 3 张。" : "Upload the image to Image BG Remover, run the background remover, and download the transparent PNG. Guest users can try 3 removals before signing in."}</p>
        <h2 className="text-2xl font-bold text-gray-900">{zh ? "第 3 步：添加最终背景" : "Step 3: Add the final background"}</h2>
        <p>{zh ? "如果需要 Amazon 风格主图，把透明 PNG 放到纯白背景上。发布前仍要按平台当前图片规则检查。" : "If you need an Amazon-style main image, put the transparent PNG on a pure white background. Check the final listing image against the marketplace's current image rules before publishing."}</p>
        <h2 className="text-2xl font-bold text-gray-900">{zh ? "第 4 步：放大重复工作流" : "Step 4: Scale repeat workflows"}</h2>
        <p>{zh ? "如果要重复处理商品图，可以登录后使用按量包、月订阅或 API Key。API 试用为每天 30 次，共 5 天。" : "For repeat product work, sign in to use credits, monthly plans, or API keys from the dashboard. API trial access is 30 requests per day for 5 days."}</p>
        <div className="rounded-lg bg-purple-50 p-5">
          <p className="font-semibold text-purple-900">{zh ? "准备测试一张图片？" : "Ready to test one image?"}</p>
          <Link href="/" className="mt-3 inline-flex rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700">
            {zh ? "开始去背景" : "Remove a background"}
          </Link>
        </div>
      </ContentSection>
    </SiteShell>
  );
}
