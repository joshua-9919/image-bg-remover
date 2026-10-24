import type { Metadata } from "next";
import { ContentSection, PageHero, SiteShell } from "../../components/SiteShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Image BG Remover, including uploads, accounts, analytics, payments, API keys, and data retention.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <PageHero title="Privacy Policy" subtitle="How Image BG Remover handles uploads, account data, analytics, payments, and API usage." />
      <ContentSection>
        <p>Last updated: June 15, 2026.</p>
        <h2 className="text-2xl font-bold text-gray-900">Data we process</h2>
        <p>When you use the remover, your image is sent to our background-removal provider for processing. We return a transparent PNG to your browser. Logged-in accounts may store processing history metadata such as file name, file size, and processing time. We do not use your uploaded images to train our own models.</p>
        <h2 className="text-2xl font-bold text-gray-900">Account and login data</h2>
        <p>If you sign in with Google, we store your Google account ID, email address, display name, avatar URL, plan type, credits, usage counts, and session token. Sessions are stored for up to 30 days unless you sign out earlier.</p>
        <h2 className="text-2xl font-bold text-gray-900">Third-party services</h2>
        <p>We use Google Sign-In for authentication, Google Analytics for aggregate product analytics, PayPal for payments, Cloudflare Workers, KV, D1, and assets for hosting and storage, and a background-removal API provider to process uploads.</p>
        <h2 className="text-2xl font-bold text-gray-900">Payments and API keys</h2>
        <p>Payment details are handled by PayPal. We store order status, purchased plan, credits added, PayPal identifiers, and subscription status. API keys are stored as hashes; the full key is shown only once when it is created.</p>
        <h2 className="text-2xl font-bold text-gray-900">Retention</h2>
        <p>Usage logs, account records, order records, and processing-history metadata are retained while your account is active or as needed for security, accounting, fraud prevention, and service operation. You can contact us to request account deletion.</p>
        <h2 className="text-2xl font-bold text-gray-900">Contact</h2>
        <p>For privacy requests, use the contact page and include the email address associated with your account.</p>
      </ContentSection>
    </SiteShell>
  );
}
