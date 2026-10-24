import type { Metadata } from "next";
import { ContentSection, PageHero, SiteShell } from "../../components/SiteShell";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund and cancellation policy for Image BG Remover credit packs and monthly subscriptions.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <SiteShell>
      <PageHero title="Refund Policy" subtitle="How refunds, duplicate charges, failed processing, and subscription cancellations are handled." />
      <ContentSection>
        <p>Last updated: June 15, 2026.</p>
        <h2 className="text-2xl font-bold text-gray-900">Credit packs</h2>
        <p>Contact us if you purchased credits by mistake, experienced a duplicate charge, or were charged but credits were not applied. We review refund requests based on account usage and payment records.</p>
        <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
        <p>You can cancel a subscription from your dashboard. Cancellation stops future billing but does not automatically refund a current billing period unless required by law or approved after review.</p>
        <h2 className="text-2xl font-bold text-gray-900">Failed processing</h2>
        <p>If a successful charge was followed by repeated technical failures, include the account email, approximate time, and affected file type in your support request. Do not send sensitive images unless requested through a secure support workflow.</p>
        <h2 className="text-2xl font-bold text-gray-900">How to request help</h2>
        <p>Use the contact page and include your PayPal transaction ID, account email, and a short description of the issue.</p>
      </ContentSection>
    </SiteShell>
  );
}
