// OpenNext Cloudflare 配置
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // OpenNext Cloudflare for Pages 配置
  override: {
    wrapper: "cloudflare-pages",
    converter: "cloudflare-pages",
  },
});
