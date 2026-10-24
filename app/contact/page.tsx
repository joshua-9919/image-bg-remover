import type { Metadata } from "next";
import { ContentSection, PageHero, SiteShell } from "../../components/SiteShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Image BG Remover for billing, privacy, API, and support questions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHero title="Contact" subtitle="Support for account, billing, privacy, API, and product-photo workflow questions." />
      <ContentSection>
        <h2 className="text-2xl font-bold text-gray-900">Support requests</h2>
        <p>Email: <a className="font-semibold text-purple-700 hover:text-purple-900" href="mailto:support@image-bg-remove.shop">support@image-bg-remove.shop</a></p>
        <p>For billing issues, include your PayPal transaction ID and account email. For API issues, include the endpoint, approximate time, and error message. Do not send API keys or passwords.</p>
        <h2 className="text-2xl font-bold text-gray-900">Privacy requests</h2>
        <p>For account deletion or privacy questions, use the same support address and include the Google account email used to sign in.</p>
      </ContentSection>
    </SiteShell>
  );
}
