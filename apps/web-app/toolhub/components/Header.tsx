"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
  categories: { id: string; name: string }[];
  active: string;
  onChange: (id: string) => void;
}

export default function Header({ categories, active, onChange }: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<{
    city: string;
    temp: number;
    desc: string;
    icon: string;
  } | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const API_KEY =
      process.env.NEXT_PUBLIC_OPENWEATHERMAP_KEY ??
      "eea0ca06a1c82fd12a65a16669dffb62";
    const controller = new AbortController();
    let weatherTimeout: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;

    const DEFAULT: typeof weather = {
      city: "上海",
      temp: 18,
      desc: "多云",
      icon: "02d",
    };

    const fetchWeather = (url: string) => {
      weatherTimeout = setTimeout(() => controller.abort(), 5000);
      fetch(url, { signal: controller.signal })
        .then((r) => r.json())
        .then((d) => {
          if (!mounted) return;
          if (d && d.main) {
            setWeather({
              city: d.name || "定位城市",
              temp: Math.round(d.main.temp),
              desc: d.weather?.[0]?.description || "",
              icon: d.weather?.[0]?.icon || "",
            });
          } else {
            setWeather(DEFAULT);
          }
        })
        .catch(() => mounted && setWeather(DEFAULT))
        .finally(() => clearTimeout(weatherTimeout));
    };

    const byCityUrl =
      "https://api.openweathermap.org/data/2.5/weather?q=Shanghai&appid=" +
      API_KEY +
      "&units=metric&lang=zh_cn";

    if (!API_KEY || API_KEY === "eea0ca06a1c82fd12a65a16669dffb62") {
      // 未配置 API Key 或仍是默认占位 → 直接用城市接口（省去一次 geolocation 失败的往返）
      fetchWeather(byCityUrl);
      return () => {
        mounted = false;
        controller.abort();
        if (weatherTimeout) clearTimeout(weatherTimeout);
      };
    }

    if (
      typeof navigator !== "undefined" &&
      navigator.geolocation &&
      typeof navigator.geolocation.getCurrentPosition === "function"
    ) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mounted) return;
          const { latitude: lat, longitude: lon } = pos.coords;
          const byCoordUrl =
            "https://api.openweathermap.org/data/2.5/weather?lat=" +
            lat +
            "&lon=" +
            lon +
            "&appid=" +
            API_KEY +
            "&units=metric&lang=zh_cn";
          fetchWeather(byCoordUrl);
        },
        () => {
          if (!mounted) return;
          // 定位失败：权限拒绝 / 位置不可用 / 超时 → 回退到上海
          fetchWeather(byCityUrl);
        },
        {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 30 * 60 * 1000,
        },
      );
    } else {
      // 浏览器不支持 geolocation
      fetchWeather(byCityUrl);
    }

    return () => {
      mounted = false;
      controller.abort();
      if (weatherTimeout) clearTimeout(weatherTimeout);
    };
  }, []);

  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateStr = now
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}  ${weekdays[now.getDay()]}`
    : "--";
  const timeStr = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    : "--:--:--";

  return (
    <header className="relative z-20 w-full">
      <div className="max-w-[1400px] mx-auto px-6 pt-6">
        <div className="glass-card px-5 py-3 flex items-center gap-4">
          {/* 左：Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{
                background:
                  "linear-gradient(135deg, #3bd3ff 0%, #7c5cff 100%)",
                boxShadow: "0 0 20px rgba(59,211,255,0.55)",
              }}
            >
              T
            </div>
            <div className="hidden sm:block">
              <div
                className="font-bold text-lg tracking-wide"
                style={{
                  background:
                    "linear-gradient(135deg, #3bd3ff 0%, #c7b6ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ToolHub
              </div>
              <div className="text-xs" style={{ color: "var(--text-2)" }}>
                常用工具 · 一站到底
              </div>
            </div>
          </div>

          {/* 中：导航（可滚动） */}
          <nav className="flex-1 flex justify-center min-w-0 overflow-x-auto">
            <div className="flex items-center gap-2 py-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`nav-tab whitespace-nowrap ${
                    active === c.id ? "active" : ""
                  }`}
                  onClick={() => onChange(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </nav>

          {/* 右：日期 + 天气 */}
          <div
            className="flex-shrink-0 hidden md:flex items-center gap-4 pl-4"
            style={{
              borderLeft: "1px solid rgba(124,92,255,0.25)",
            }}
          >
            <div className="text-right">
              <div
                className="text-sm font-mono"
                style={{ color: "var(--accent)" }}
              >
                {timeStr}
              </div>
              <div className="text-xs" style={{ color: "var(--text-2)" }}>
                {dateStr}
              </div>
            </div>
            {weather && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,211,255,0.15), rgba(124,92,255,0.12))",
                  border: "1px solid rgba(59,211,255,0.3)",
                }}
              >
                <span className="text-lg">☀️</span>
                <div className="text-xs leading-tight">
                  <div style={{ color: "var(--text-1)" }}>
                    {weather.city} · {weather.temp} ℃
                  </div>
                  <div style={{ color: "var(--text-2)" }}>
                    {weather.desc || "晴"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
