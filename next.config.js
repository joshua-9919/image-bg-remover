/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 需要输出为静态文件
  output: 'export',
  
  // 禁用图像优化（Cloudflare Pages 不支持）
  images: {
    unoptimized: true,
  },
  
  // 关闭 ESLint 检查（构建更快）
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 关闭类型检查（构建更快）
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Next.js 15 配置
  // 禁用服务器端功能（Cloudflare Pages 静态部署）
  serverExternalPackages: [],
}

module.exports = nextConfig
