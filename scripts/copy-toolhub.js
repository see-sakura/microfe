/* eslint-disable no-console */
/**
 * 将 apps/web-app/toolhub 的 Next.js 构建产物 copy 到仓库根目录 dist/toolhub
 *
 * 前置：pnpm -F toolhub run build 已执行（toolhub/next.config.ts 开启了 output: "standalone"）
 * 产物：
 *   dist/toolhub/                 ← 对外部署目录
 *   ├─ server.js                  ← standalone 入口，node server.js 即可启动
 *   ├─ .next/static/              ← 静态资源
 *   ├─ .next/standalone/          ← 独立运行时（含 next 依赖）
 *   ├─ public/                    ← 原 toolhub/public 静态文件
 *   └─ package.json               ← 供参考
 */
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const APP = path.join(REPO_ROOT, "apps", "web-app", "toolhub");
const DIST = path.join(REPO_ROOT, "dist", "toolhub");

const SRC_NEXT = path.join(APP, ".next");
const SRC_STANDALONE = path.join(SRC_NEXT, "standalone");
const SRC_STATIC = path.join(SRC_NEXT, "static");
const SRC_PUBLIC = path.join(APP, "public");

function assertExists(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`✗ ${label} 不存在：${p}`);
    console.error("  请先执行 pnpm build:toolhub");
    process.exit(1);
  }
}

function rimraf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  console.log("📦 复制 toolhub 构建产物到 dist/toolhub ...");
  assertExists(SRC_NEXT, "toolhub/.next");
  assertExists(SRC_STANDALONE, "toolhub/.next/standalone");
  assertExists(SRC_STATIC, "toolhub/.next/static");

  // 1. 清空目标目录
  rimraf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  // 2. standalone 运行时整体搬过去（包含 next 二进制、pages-manifest 等）
  copyDir(SRC_STANDALONE, path.join(DIST, ".next", "standalone"));

  // 3. 静态资源（字体、chunk JS/CSS、图片等）
  copyDir(SRC_STATIC, path.join(DIST, ".next", "static"));

  // 4. Next.js 所需 manifest（从 toolhub/.next 根目录挑必须的）
  const manifestFiles = [
    "build-manifest.json",
    "routes-manifest.json",
    "prerender-manifest.json",
    "required-server-files.json",
    "images-manifest.json",
    "fallback-build-manifest.json",
  ];
  for (const f of manifestFiles) {
    const src = path.join(SRC_NEXT, f);
    if (fs.existsSync(src)) copyFile(src, path.join(DIST, ".next", f));
  }

  // 5. standalone 生成的 server.js、package.json 等提到 dist 根
  const standaloneFiles = ["server.js", "package.json"];
  for (const f of standaloneFiles) {
    const src = path.join(SRC_STANDALONE, f);
    if (fs.existsSync(src)) copyFile(src, path.join(DIST, f));
  }

  // 6. toolhub/public 里的静态资源（favicon、robots.txt 等）
  if (fs.existsSync(SRC_PUBLIC)) {
    copyDir(SRC_PUBLIC, path.join(DIST, "public"));
  }

  // 7. 从 standalone 里找到 server.js 所在的原始位置，补齐独立运行所需的 server 目录
  const srcStandaloneServer = path.join(SRC_STANDALONE, ".next", "server");
  if (fs.existsSync(srcStandaloneServer)) {
    copyDir(srcStandaloneServer, path.join(DIST, ".next", "server"));
  }

  console.log("✅ 完成！部署产物目录：", DIST);
  console.log("   运行方式：cd dist/toolhub && node server.js");
}

main();
