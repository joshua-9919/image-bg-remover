// OpenNext Cloudflare 配置
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // 使用 Cloudflare Pages 适配器
  override: {
    wrapper: "cloudflare-pages",
    converter: "cloudflare-pages",
  },
  
  // 配置输出目录
  build: {
    outputDir: ".open-next",
  },
});
