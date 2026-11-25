import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // 开启 standalone：构建后 .next/standalone 下有可独立运行的产物
  // 根目录 build 脚本会把它 copy 到 dist/toolhub
  output: "standalone",
};

export default nextConfig;
