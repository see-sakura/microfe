"use client";

import { useState } from "react";
import Header from "./Header";
import CalculatorPanel, { CALC_TABS } from "./CalculatorPanel";

interface ToolDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: string; // 对应 categories 的 id
  /** 可选：外部链接 */
  link?: string;
  /** 如果设为 "calculator" 则展开计算器面板 */
  action?: "calculator" | "link";
}

/* ---------- 分类 ---------- */
const CATEGORIES = [
  { id: "all", name: "全部" },
  { id: "calc", name: "计算器" },
  { id: "office", name: "办公效率" },
  { id: "learn", name: "学习辅助" },
  { id: "finance", name: "财务测算" },
  { id: "life", name: "生活出行" },
  { id: "dev", name: "开发工具" },
  { id: "design", name: "设计素材" },
];

/* ---------- 工具清单（可按需扩展） ---------- */
const TOOLS: ToolDef[] = [
  // 计算器分类（融合原 html）
  { id: "calc-all", title: "学习/工作/装修计算器合集", desc: "基础计算、单位换算、装修、亩/平、油耗、电车、GPA、百分比", icon: "🧮", category: "calc", action: "calculator" },

  // 办公效率
  { id: "office-pdf", title: "在线 PDF 编辑", desc: "合并、拆分、压缩、转 Word/图片", icon: "📄", category: "office", link: "https://www.ilovepdf.com/" },
  { id: "office-img", title: "图片压缩", desc: "JPG / PNG / WebP 无损压缩", icon: "🖼️", category: "office", link: "https://tinypng.com/" },
  { id: "office-ocr", title: "OCR 文字识别", desc: "图片转文字，支持多语言", icon: "🔍", category: "office", link: "https://ocr.space/" },
  { id: "office-markdown", title: "Markdown 编辑器", desc: "实时预览，支持导出 PDF", icon: "📝", category: "office", link: "https://dillinger.io/" },
  { id: "office-translate", title: "多语言翻译", desc: "DeepL / Google 翻译", icon: "🌐", category: "office", link: "https://www.deepl.com/translator" },
  { id: "office-qr", title: "二维码生成", desc: "文本/链接/名片转二维码", icon: "📱", category: "office", link: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https" },

  // 学习辅助
  { id: "learn-gpa", title: "GPA 计算器", desc: "加权平均分一键计算", icon: "🎓", category: "learn", action: "calculator" },
  { id: "learn-word", title: "单词翻译词典", desc: "欧路 / 金山词霸", icon: "📖", category: "learn", link: "https://dict.eudic.net/" },
  { id: "learn-paper", title: "论文查重", desc: "PaperPass / 知网", icon: "📚", category: "learn", link: "https://www.paperpass.net/" },

  // 财务测算
  { id: "finance-loan", title: "房贷/车贷计算器", desc: "等额本息 / 等额本金", icon: "🏦", category: "finance", link: "https://www.cmbchina.com/calculator/loan/" },
  { id: "finance-tax", title: "个税计算器", desc: "2024 年新版税率表", icon: "💰", category: "finance", link: "https://www.gerenshuijisuanqi.com/" },
  { id: "finance-percent", title: "百分比计算器", desc: "增长率 / 占比", icon: "📊", category: "finance", action: "calculator" },

  // 生活出行
  { id: "life-fuel", title: "油耗计算器", desc: "百公里油耗 / 每公里油费", icon: "⛽", category: "life", action: "calculator" },
  { id: "life-ev", title: "电车充电成本", desc: "百公里电耗 / 行程电费", icon: "🚗", category: "life", action: "calculator" },
  { id: "life-area", title: "亩/平方米换算", desc: "土地面积快速换算", icon: "🌾", category: "life", action: "calculator" },
  { id: "life-date", title: "日期计算", desc: "间隔天数 / 工作日", icon: "📅", category: "life", link: "https://www.timeanddate.com/date/duration.html" },
  { id: "life-train", title: "火车票查询", desc: "12306 余票查询", icon: "🚄", category: "life", link: "https://www.12306.cn/" },

  // 开发工具
  { id: "dev-json", title: "JSON 格式化", desc: "美化 / 压缩 / 校验", icon: "{ }", category: "dev", link: "https://jsoneditoronline.org/" },
  { id: "dev-regex", title: "正则测试器", desc: "在线调试正则", icon: ".*", category: "dev", link: "https://regex101.com/" },
  { id: "dev-color", title: "颜色转换", desc: "HEX / RGB / HSL 互转", icon: "🎨", category: "dev", link: "https://www.color-hex.com/" },
  { id: "dev-timestamp", title: "时间戳转换", desc: "Unix 时间戳 ↔ 日期", icon: "⏱️", category: "dev", link: "https://www.timestamp-converter.com/" },
  { id: "dev-base64", title: "Base64 编解码", desc: "在线 Base64 工具", icon: "🔐", category: "dev", link: "https://www.base64decode.org/" },
  { id: "dev-unit", title: "单位换算器", desc: "长度/面积/体积/重量/温度", icon: "📏", category: "dev", action: "calculator" },

  // 设计素材
  { id: "design-unsplash", title: "免费高清图", desc: "Unsplash 高质量素材", icon: "🖼", category: "design", link: "https://unsplash.com/" },
  { id: "design-icon", title: "图标库", desc: "Lucide / Heroicons 免费用", icon: "✨", category: "design", link: "https://lucide.dev/" },
  { id: "design-font", title: "字体下载", desc: "Google Fonts 免费字体", icon: "Aa", category: "design", link: "https://fonts.google.com/" },
  { id: "design-grad", title: "渐变色生成", desc: "炫酷配色一键导出 CSS", icon: "🌈", category: "design", link: "https://uigradients.com/" },
];

export default function ToolSite() {
  const [activeCat, setActiveCat] = useState("all");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const filtered =
    activeCat === "all"
      ? TOOLS
      : TOOLS.filter((t) => t.category === activeCat);

  const handleToolClick = (tool: ToolDef) => {
    if (tool.action === "calculator") {
      setExpandedTool(expandedTool === tool.id ? null : tool.id);
      if (tool.id === "calc-all") {
        // 默认打开
      }
    } else if (tool.link) {
      window.open(tool.link, "_blank", "noopener,noreferrer");
    }
  };

  const isCalcExpanded =
    expandedTool !== null &&
    TOOLS.find((t) => t.id === expandedTool)?.action === "calculator";

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      {/* 背景层 */}
      <div className="tech-bg" />

      {/* Header */}
      <Header
        categories={CATEGORIES}
        active={activeCat}
        onChange={(id) => {
          setActiveCat(id);
          setExpandedTool(null);
        }}
      />

      {/* Hero */}
      <section className="max-w-[1400px] w-full mx-auto px-6 pt-10 pb-6 text-center">
        <div
          className="inline-block px-4 py-1 rounded-full text-xs font-medium mb-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,211,255,0.2), rgba(124,92,255,0.2))",
            border: "1px solid rgba(59,211,255,0.4)",
            color: "var(--accent)",
          }}
        >
          ✦ 科技风在线工具合集 · 即点即用
        </div>
        <h1
          className="text-3xl md:text-5xl font-bold tracking-tight mb-3"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #3bd3ff 55%, #7c5cff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ToolHub · 工作人员常用工具一站到底
        </h1>
        <p
          className="text-sm md:text-base max-w-2xl mx-auto"
          style={{ color: "var(--text-2)" }}
        >
          面向职场人士的一站式在线工具合集：计算器、办公效率、学习辅助、财务测算、生活出行、开发工具、设计素材，七大类数十款常用工具，科技感分类展示，点击卡片即可使用。
        </p>
      </section>

      {/* 主内容 */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 pb-20">
        {/* 展开面板 */}
        {isCalcExpanded && (
          <div className="glass-card p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                🔧 正在使用：{TOOLS.find((t) => t.id === expandedTool)?.title}
              </div>
              <button
                className="btn-ghost text-xs"
                onClick={() => setExpandedTool(null)}
              >
                收起 ▲
              </button>
            </div>
            <CalculatorPanel />
          </div>
        )}

        {/* 工具网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((tool, i) => (
            <div
              key={tool.id}
              className="glass-card tool-card"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => handleToolClick(tool)}
            >
              <div className="flex items-start gap-3">
                <div className="tool-icon">{tool.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="tool-title truncate">{tool.title}</div>
                  <div className="tool-desc line-clamp-2">{tool.desc}</div>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--text-2)" }}>
                <span>
                  {tool.action === "calculator"
                    ? "⚡ 站内工具"
                    : tool.link
                    ? "↗ 外部链接"
                    : "—"}
                </span>
                <span>点击使用 →</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20" style={{ color: "var(--text-2)" }}>
            暂无此分类下的工具
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 py-6 text-center text-xs"
        style={{ color: "var(--text-2)" }}
      >
        <div>ToolHub · 工作人员常用网页工具合集</div>
        <div className="mt-1 opacity-70">
          {CALC_TABS.length + 10}+ 款工具 · 7 大分类 · 本地离线可用历史记录
        </div>
      </footer>
    </div>
  );
}
