import type { Metadata } from "next";
import { BlogContent } from "../../components/MarketingPages";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides for removing image backgrounds, preparing ecommerce photos, and using transparent PNGs in product workflows.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return <BlogContent />;
}
