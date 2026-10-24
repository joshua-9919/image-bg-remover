import type { Metadata } from "next";
import { ContentSection, PageHero, SiteShell } from "../../components/SiteShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Image BG Remover accounts, uploads, API keys, payments, subscriptions, and acceptable use.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <SiteShell>
      <PageHero title="Terms of Service" subtitle="The rules for using Image BG Remover, paid credits, subscriptions, and API access." />
      <ContentSection>
        <p>Last updated: June 15, 2026.</p>
        <h2 className="text-2xl font-bold text-gray-900">Use of the service</h2>
        <p>You may use Image BG Remover to process images you own or have permission to use. You are responsible for your uploaded content and for how you use the processed output.</p>
        <h2 className="text-2xl font-bold text-gray-900">Accounts and security</h2>
        <p>You are responsible for keeping your account and API keys secure. Do not share API keys publicly or use the service to process unlawful, harmful, or infringing content.</p>
        <h2 className="text-2xl font-bold text-gray-900">Free trial, credits, and subscriptions</h2>
        <p>Guest users receive 3 removals. Signed-in free users receive a 3-day trial with 3 web removals per day. API trial access provides 30 requests per day for 5 days. Paid credit packs and subscriptions are subject to the limits shown on the pricing page and dashboard.</p>
        <h2 className="text-2xl font-bold text-gray-900">No guarantee of marketplace acceptance</h2>
        <p>We provide background removal tools and educational guidance. Marketplace policies, including Amazon image rules, can change. You remain responsible for checking final image compliance before publishing.</p>
        <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
        <p>The service may be limited by provider downtime, quota limits, payment-provider availability, maintenance, or abuse-prevention measures.</p>
        <h2 className="text-2xl font-bold text-gray-900">Refunds</h2>
        <p>Refund handling is described in our Refund Policy.</p>
      </ContentSection>
    </SiteShell>
  );
}
