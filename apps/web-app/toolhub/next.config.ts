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
  // Turbopack Tailwind v4 loader —— 不配置这个 Tailwind 原子类不会被生成
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
