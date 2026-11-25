"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ---------- 类型 ---------- */
interface HistoryItem {
  text: string;
  raw?: any;
}

const HIST_KEY_PREFIX = "toolhub_calc_";

/* ---------- 本地历史 ---------- */
function getHist(key: string): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HIST_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveHist(key: string, item: HistoryItem) {
  const arr = [item, ...getHist(key)].slice(0, 15);
  localStorage.setItem(HIST_KEY_PREFIX + key, JSON.stringify(arr));
}
function clearHist(key: string) {
  localStorage.removeItem(HIST_KEY_PREFIX + key);
}

/* ---------- 单位配置 ---------- */
const unitMap: Record<string, { k: string; n: string }[]> = {
  length: [
    { k: "m", n: "米" },
    { k: "cm", n: "厘米" },
    { k: "mm", n: "毫米" },
    { k: "km", n: "千米" },
    { k: "inch", n: "英寸" },
    { k: "ft", n: "英尺" },
  ],
  area: [
    { k: "m2", n: "平方米" },
    { k: "km2", n: "平方千米" },
    { k: "acre", n: "英亩" },
    { k: "sqft", n: "平方英尺" },
  ],
  volume: [
    { k: "L", n: "升" },
    { k: "ml", n: "毫升" },
    { k: "m3", n: "立方米" },
    { k: "gal", n: "加仑" },
  ],
  weight: [
    { k: "kg", n: "千克" },
    { k: "g", n: "克" },
    { k: "jin", n: "斤" },
    { k: "lb", n: "磅" },
  ],
  temp: [
    { k: "c", n: "摄氏度" },
    { k: "f", n: "华氏度" },
  ],
};
const unitRate: Record<string, Record<string, number>> = {
  length: { m: 1, cm: 0.01, mm: 0.001, km: 1000, inch: 0.0254, ft: 0.3048 },
  area: {
    m2: 1,
    km2: 1_000_000,
    acre: 4046.8564224,
    sqft: 0.09290304,
  },
  volume: { L: 1, ml: 0.001, m3: 1000, gal: 3.785411784 },
  weight: { kg: 1, g: 0.001, jin: 0.5, lb: 0.45359237 },
};

/* ---------- 导出 tab 列表 ---------- */
export const CALC_TABS = [
  { id: "base", name: "基础计算器" },
  { id: "unit", name: "单位换算" },
  { id: "decoration", name: "装修计算器" },
  { id: "area", name: "亩/平方米换算" },
  { id: "fuel", name: "油耗计算器" },
  { id: "ev", name: "电车充电成本" },
  { id: "gpa", name: "GPA 计算器" },
  { id: "percent", name: "百分比计算器" },
];

/* =========================================================
   基础计算器（对象式）
   ========================================================= */
function useBaseCalc() {
  const [exp, setExp] = useState("0");
  const displayRef = useRef<HTMLInputElement>(null);

  const input = (s: string) => {
    setExp((prev) => {
      if (prev === "0" && !["+", "-", "*", "/", "."].includes(s)) return s;
      return prev + s;
    });
  };
  const clear = () => setExp("0");
  const back = () =>
    setExp((p) => (p.length <= 1 ? "0" : p.slice(0, -1)));
  const neg = () =>
    setExp((p) => {
      const v = Number(p);
      return String(-v);
    });
  const sq = () => {
    const v = Number(exp);
    const res = v * v;
    const text = `${v}² = ${res}`;
    setExp(String(res));
    saveHist("base", { text });
  };
  const cu = () => {
    const v = Number(exp);
    const res = v * v * v;
    const text = `${v}³ = ${res}`;
    setExp(String(res));
    saveHist("base", { text });
  };
  const sqrt = () => {
    const v = Number(exp);
    if (v < 0) {
      setExp("错误");
      return;
    }
    const res = Math.sqrt(v);
    const text = `√${v} = ${res.toFixed(4)}`;
    setExp(String(res));
    saveHist("base", { text });
  };
  const percent = () => {
    const v = Number(exp);
    const res = v / 100;
    const text = `${v}% = ${res}`;
    setExp(String(res));
    saveHist("base", { text });
  };
  const eq = () => {
    try {
      const str = exp.replace(/×/g, "*").replace(/−/g, "-");
      const res = Function(`"use strict"; return (${str})`)();
      const text = `${exp} = ${res}`;
      setExp(String(res));
      saveHist("base", { text });
    } catch {
      setExp("错误");
    }
  };

  // 键盘支持
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (displayRef.current && document.activeElement !== displayRef.current) {
        if (/^[0-9.+\-*/]$/.test(e.key)) input(e.key);
        else if (e.key === "Enter" || e.key === "=") {
          e.preventDefault();
          eq();
        } else if (e.key === "Backspace") back();
        else if (e.key.toLowerCase() === "c") clear();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exp]);

  return { exp, input, clear, back, neg, sq, cu, sqrt, percent, eq, displayRef };
}

/* =========================================================
   主组件
   ========================================================= */
export default function CalculatorPanel() {
  const [tab, setTab] = useState("base");
  const base = useBaseCalc();

  // 历史刷新标记
  const [tick, setTick] = useState(0);
  const refreshHist = () => setTick((t) => t + 1);

  /* ---- 基础计算器 ---- */
  const renderBase = () => {
    const history = getHist("base");
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="calc-wrap flex-1 max-w-[420px]">
          <input
            ref={base.displayRef}
            className="calc-display"
            readOnly
            value={base.exp}
          />
          <div className="calc-buttons">
            <button className="calc-btn func" onClick={base.clear}>
              C
            </button>
            <button className="calc-btn func" onClick={base.back}>
              ⌫
            </button>
            <button className="calc-btn func" onClick={base.neg}>
              ±
            </button>
            <button className="calc-btn op" onClick={() => base.input("/")}>
              ÷
            </button>

            <button className="calc-btn" onClick={() => base.input("7")}>
              7
            </button>
            <button className="calc-btn" onClick={() => base.input("8")}>
              8
            </button>
            <button className="calc-btn" onClick={() => base.input("9")}>
              9
            </button>
            <button className="calc-btn op" onClick={() => base.input("*")}>
              ×
            </button>

            <button className="calc-btn" onClick={() => base.input("4")}>
              4
            </button>
            <button className="calc-btn" onClick={() => base.input("5")}>
              5
            </button>
            <button className="calc-btn" onClick={() => base.input("6")}>
              6
            </button>
            <button className="calc-btn op" onClick={() => base.input("-")}>
              −
            </button>

            <button className="calc-btn" onClick={() => base.input("1")}>
              1
            </button>
            <button className="calc-btn" onClick={() => base.input("2")}>
              2
            </button>
            <button className="calc-btn" onClick={() => base.input("3")}>
              3
            </button>
            <button className="calc-btn op" onClick={() => base.input("+")}>
              +
            </button>

            <button className="calc-btn" onClick={() => base.input("0")}>
              0
            </button>
            <button className="calc-btn" onClick={() => base.input(".")}>
              .
            </button>
            <button className="calc-btn func" onClick={base.sq}>
              x²
            </button>
            <button className="calc-btn func" onClick={base.cu}>
              x³
            </button>

            <button className="calc-btn func" onClick={base.sqrt}>
              √
            </button>
            <button className="calc-btn func" onClick={base.percent}>
              %
            </button>
            <button className="calc-btn eq" onClick={base.eq}>
              =
            </button>
          </div>
          <div className="mt-4 text-xs" style={{ color: "var(--text-2)" }}>
            💡 支持键盘：数字 / 运算符 / Enter=等于 / Backspace / C 清屏
          </div>
        </div>
        <HistoryList
          items={history}
          key={tick + "-base"}
          onClear={() => {
            clearHist("base");
            refreshHist();
          }}
          title="基础计算器 · 历史"
        />
      </div>
    );
  };

  /* ---- 单位换算 ---- */
  const renderUnit = () => <UnitPanel tick={tick} refresh={refreshHist} />;
  /* ---- 装修 ---- */
  const renderDecoration = () => (
    <DecorationPanel tick={tick} refresh={refreshHist} />
  );
  /* ---- 亩/平 ---- */
  const renderArea = () => <AreaPanel tick={tick} refresh={refreshHist} />;
  /* ---- 油耗 ---- */
  const renderFuel = () => <FuelPanel tick={tick} refresh={refreshHist} />;
  /* ---- 电车 ---- */
  const renderEv = () => <EvPanel tick={tick} refresh={refreshHist} />;
  /* ---- GPA ---- */
  const renderGpa = () => <GpaPanel tick={tick} refresh={refreshHist} />;
  /* ---- 百分比 ---- */
  const renderPercent = () => <PercentPanel tick={tick} refresh={refreshHist} />;

  const renderMap: Record<string, () => ReactNode> = {
    base: renderBase,
    unit: renderUnit,
    decoration: renderDecoration,
    area: renderArea,
    fuel: renderFuel,
    ev: renderEv,
    gpa: renderGpa,
    percent: renderPercent,
  };

  return (
    <div className="panel-expand">
      {/* 子 tab */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CALC_TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab whitespace-nowrap ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>
      {renderMap[tab]?.()}
    </div>
  );
}

/* =========================================================
   公共：历史记录列表
   ========================================================= */
function HistoryList({
  items,
  onClear,
  title,
}: {
  items: HistoryItem[];
  onClear: () => void;
  title: string;
}) {
  return (
    <div className="flex-1 max-w-md min-w-[260px]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
          {title}
        </div>
        <button className="btn-ghost text-xs" onClick={onClear}>
          清空
        </button>
      </div>
      <div className="max-h-[380px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="text-xs" style={{ color: "var(--text-2)" }}>
            暂无记录
          </div>
        ) : (
          items.map((it, i) => (
            <div key={i} className="history-item">
              {it.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   子面板：单位换算
   ========================================================= */
function UnitPanel({
  tick,
  refresh,
}: {
  tick: number;
  refresh: () => void;
}) {
  const [type, setType] = useState("length");
  const [val, setVal] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("cm");
  const [result, setResult] = useState("");

  const options = unitMap[type];
  useEffect(() => {
    setFrom(options[0].k);
    setTo(options[1]?.k || options[0].k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const calc = () => {
    const v = Number(val);
    let res: number;
    if (type === "temp") {
      if (from === "c" && to === "f") res = v * 9 / 5 + 32;
      else if (from === "f" && to === "c") res = (v - 32) * 5 / 9;
      else res = v;
    } else {
      const base = v * unitRate[type][from];
      res = base / unitRate[type][to];
    }
    const fn = unitMap[type].find((x) => x.k === from)?.n;
    const tn = unitMap[type].find((x) => x.k === to)?.n;
    const text = `${v} ${fn} = ${res.toFixed(4)} ${tn}`;
    setResult(text);
    saveHist("unit", { text });
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-md space-y-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
            分类
          </label>
          <select className="input-neon" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="length">长度</option>
            <option value="area">面积</option>
            <option value="volume">体积</option>
            <option value="weight">重量</option>
            <option value="temp">温度</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
            输入数值
          </label>
          <input
            className="input-neon"
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="输入数字"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
              从
            </label>
            <select className="input-neon" value={from} onChange={(e) => setFrom(e.target.value)}>
              {options.map((u) => (
                <option key={u.k} value={u.k}>{u.n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
              转换到
            </label>
            <select className="input-neon" value={to} onChange={(e) => setTo(e.target.value)}>
              {options.map((u) => (
                <option key={u.k} value={u.k}>{u.n}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-neon" onClick={calc}>计算</button>
        {result && <div className="result-neon">{result}</div>}
      </div>
      <HistoryList
        items={getHist("unit")}
        key={tick + "-unit"}
        onClear={() => {
          clearHist("unit");
          refresh();
        }}
        title="单位换算 · 历史"
      />
    </div>
  );
}

/* ---- 装修 ---- */
function DecorationPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const [type, setType] = useState("tile");
  const [area, setArea] = useState("");
  const [tileSize, setTileSize] = useState("800×800");
  const [loss, setLoss] = useState("5");
  const [result, setResult] = useState("");

  const calc = () => {
    const a = Number(area);
    const ls = Number(loss) / 100;
    let text: string;
    if (type === "tile") {
      const [w, h] = tileSize.split("×").map(Number);
      const per = (w / 1000) * (h / 1000);
      const num = a / per * (1 + ls);
      text = `瓷砖：单块面积 ${per.toFixed(4)}㎡，需要 ${Math.ceil(num)} 片（含损耗）`;
    } else {
      const paint = a / 8 * (1 + ls);
      text = `乳胶漆：需要 ${paint.toFixed(2)} L（含损耗，按一遍估算）`;
    }
    setResult(text);
    saveHist("decoration", { text });
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-md space-y-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
            计算类型
          </label>
          <select className="input-neon" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="tile">瓷砖用量</option>
            <option value="paint">乳胶漆用量</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
            面积 (㎡)
          </label>
          <input className="input-neon" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="铺贴/涂刷面积" />
        </div>
        {type === "tile" && (
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
              瓷砖规格 (mm) 宽×长
            </label>
            <input className="input-neon" value={tileSize} onChange={(e) => setTileSize(e.target.value)} />
          </div>
        )}
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
            损耗率 (%)
          </label>
          <input className="input-neon" type="number" value={loss} onChange={(e) => setLoss(e.target.value)} />
        </div>
        <button className="btn-neon" onClick={calc}>计算</button>
        {result && <div className="result-neon">{result}</div>}
      </div>
      <HistoryList items={getHist("decoration")} key={tick} onClear={() => { clearHist("decoration"); refresh(); }} title="装修 · 历史" />
    </div>
  );
}

/* ---- 亩/平 ---- */
function AreaPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const [type, setType] = useState("mu2m2");
  const [val, setVal] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    const v = Number(val);
    const res = type === "mu2m2" ? v * 666.6667 : v / 666.6667;
    const text = type === "mu2m2"
      ? `${v} 亩 = ${res.toFixed(2)} 平方米`
      : `${v} ㎡ = ${res.toFixed(4)} 亩`;
    setResult(text);
    saveHist("area", { text });
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-md space-y-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>类型</label>
          <select className="input-neon" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="mu2m2">亩 → 平方米</option>
            <option value="m22mu">平方米 → 亩</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>数值</label>
          <input className="input-neon" type="number" value={val} onChange={(e) => setVal(e.target.value)} placeholder="输入数值" />
        </div>
        <button className="btn-neon" onClick={calc}>计算</button>
        {result && <div className="result-neon">{result}</div>}
      </div>
      <HistoryList items={getHist("area")} key={tick} onClear={() => { clearHist("area"); refresh(); }} title="亩/平方米 · 历史" />
    </div>
  );
}

/* ---- 油耗 ---- */
function FuelPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const [l, setL] = useState("");
  const [km, setKm] = useState("");
  const [price, setPrice] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    const ll = Number(l), kkm = Number(km), pp = Number(price);
    const oil100 = ll / kkm * 100;
    const costKm = ll * pp / kkm;
    const text = `百公里油耗：${oil100.toFixed(2)} L，每公里油费：${costKm.toFixed(2)} 元`;
    setResult(text);
    saveHist("fuel", { text });
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-md space-y-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>加油升数 (L)</label>
          <input className="input-neon" type="number" value={l} onChange={(e) => setL(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>行驶里程 (km)</label>
          <input className="input-neon" type="number" value={km} onChange={(e) => setKm(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>油价 (元/L)</label>
          <input className="input-neon" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <button className="btn-neon" onClick={calc}>计算</button>
        {result && <div className="result-neon">{result}</div>}
      </div>
      <HistoryList items={getHist("fuel")} key={tick} onClear={() => { clearHist("fuel"); refresh(); }} title="油耗 · 历史" />
    </div>
  );
}

/* ---- 电车充电 ---- */
function EvPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const [kwh, setKwh] = useState("15");
  const [price, setPrice] = useState("0.6");
  const [km, setKm] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    const k = Number(kwh), p = Number(price), kkm = Number(km);
    const cost100 = k * p;
    const totalCost = kkm / 100 * cost100;
    const text = `百公里电费 ${cost100.toFixed(2)} 元，本次 ${kkm}km 合计电费 ${totalCost.toFixed(2)} 元`;
    setResult(text);
    saveHist("ev", { text });
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-md space-y-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>百公里电耗 (kWh)</label>
          <input className="input-neon" type="number" value={kwh} onChange={(e) => setKwh(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>电价 (元/度)</label>
          <input className="input-neon" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>行驶里程 (km)</label>
          <input className="input-neon" type="number" value={km} onChange={(e) => setKm(e.target.value)} />
        </div>
        <button className="btn-neon" onClick={calc}>计算</button>
        {result && <div className="result-neon">{result}</div>}
      </div>
      <HistoryList items={getHist("ev")} key={tick} onClear={() => { clearHist("ev"); refresh(); }} title="电车充电 · 历史" />
    </div>
  );
}

/* ---- GPA ---- */
function GpaPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const [txt, setTxt] = useState("4,4.0\n3,3.3\n2,3.7");
  const [result, setResult] = useState("");

  const calc = () => {
    const lines = txt.split("\n").filter((x) => x.trim());
    let sumCredit = 0, sumPoint = 0;
    lines.forEach((line) => {
      const [c, g] = line.split(",").map(Number);
      if (!isNaN(c) && !isNaN(g)) {
        sumCredit += c;
        sumPoint += c * g;
      }
    });
    const gpa = sumCredit > 0 ? sumPoint / sumCredit : 0;
    const text = `总学分：${sumCredit}，加权 GPA：${gpa.toFixed(3)}`;
    setResult(text);
    saveHist("gpa", { text });
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-md space-y-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>
            学分绩点，一行一条：<code>学分,绩点</code>
          </label>
          <textarea
            className="input-neon min-h-[160px] font-mono text-sm"
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
          />
        </div>
        <button className="btn-neon" onClick={calc}>计算</button>
        {result && <div className="result-neon">{result}</div>}
      </div>
      <HistoryList items={getHist("gpa")} key={tick} onClear={() => { clearHist("gpa"); refresh(); }} title="GPA · 历史" />
    </div>
  );
}

/* ---- 百分比 ---- */
function PercentPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const [type, setType] = useState("rate");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    const aa = Number(a), bb = Number(b);
    const res = type === "rate" ? (bb - aa) / aa * 100 : aa / bb * 100;
    const text = type === "rate"
      ? `原值 ${aa}，新值 ${bb}，增长率：${res.toFixed(2)}%`
      : `部分 ${aa}，总数 ${bb}，占比：${res.toFixed(2)}%`;
    setResult(text);
    saveHist("percent", { text });
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-md space-y-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>计算类型</label>
          <select className="input-neon" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="rate">增长率：原值、新值</option>
            <option value="part">占比：部分、总数</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>数值 A</label>
            <input className="input-neon" type="number" value={a} onChange={(e) => setA(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-2)" }}>数值 B</label>
            <input className="input-neon" type="number" value={b} onChange={(e) => setB(e.target.value)} />
          </div>
        </div>
        <button className="btn-neon" onClick={calc}>计算</button>
        {result && <div className="result-neon">{result}</div>}
      </div>
      <HistoryList items={getHist("percent")} key={tick} onClear={() => { clearHist("percent"); refresh(); }} title="百分比 · 历史" />
    </div>
  );
}
