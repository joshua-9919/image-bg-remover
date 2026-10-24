import type { Metadata } from "next";
import { AmazonGuideContent } from "../../../components/MarketingPages";

export const metadata: Metadata = {
  title: "Remove Background from Product Photos for Amazon Sellers",
  description: "A practical guide for removing product photo backgrounds and preparing transparent PNG files for Amazon-style white background workflows.",
  alternates: { canonical: "/blog/remove-background-amazon" },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Remove Background from Product Photos for Amazon Sellers",
  description: "A step-by-step workflow for removing product photo backgrounds and preparing clean ecommerce images.",
  image: "https://image-bg-remove.shop/og-image.svg",
  totalTime: "PT10S",
  step: [
    { "@type": "HowToStep", name: "Prepare your product photo", text: "Use JPG, PNG, or WebP under 5MB with clear lighting.", position: 1 },
    { "@type": "HowToStep", name: "Upload your image", text: "Open Image BG Remover and upload the product photo.", position: 2 },
    { "@type": "HowToStep", name: "Remove the background", text: "Run the AI background remover and download the transparent PNG.", position: 3 },
    { "@type": "HowToStep", name: "Add a white background", text: "For Amazon main images, place the transparent PNG on a pure white background before publishing.", position: 4 },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is Image BG Remover free to try?", acceptedAnswer: { "@type": "Answer", text: "Yes. Guest users receive 3 removals. Signed-in users receive a 3-day web trial with 3 removals per day." } },
    { "@type": "Question", name: "Does the output automatically meet Amazon requirements?", acceptedAnswer: { "@type": "Answer", text: "The tool creates a transparent PNG. You still need to place it on a pure white background and check the final image against Amazon's current image requirements." } },
    { "@type": "Question", name: "Can I use the API?", acceptedAnswer: { "@type": "Answer", text: "Signed-in users can create API keys. The API trial provides 30 requests per day for 5 days." } },
  ],
};

export default function AmazonGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <AmazonGuideContent />
    </>
  );
}
