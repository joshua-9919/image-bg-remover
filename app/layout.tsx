import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image BG Remover - 在线图片背景移除工具",
  description: "免费一键移除图片背景，3 秒完成抠图，无需注册，保护隐私",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
