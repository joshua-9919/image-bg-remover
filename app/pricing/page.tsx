import type { Metadata } from "next";
import { PricingContent } from "../../components/MarketingPages";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose credit packs or monthly plans for Image BG Remover. Start with 3 guest removals, then use paid credits or subscriptions for more images.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingContent />;
}
