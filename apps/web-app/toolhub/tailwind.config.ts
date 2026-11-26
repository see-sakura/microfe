import type { Config } from "tailwindcss";

/**
 * Tailwind v4 显式 content 配置
 * Turbopack 在 monorepo 里零配置扫描范围可能不准，
 * 这里强制让它扫 toolhub 自己的 app / components 目录
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
