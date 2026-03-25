/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用静态导出（适合 Cloudflare Pages）
  output: 'export',
  
  // 禁用图像优化（使用 CDN）
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
}

module.exports = nextConfig
