"use client";

import useSWR from "swr";
import { describeWeather, type WeatherData } from "@/lib/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function WeatherWidget() {
  const { data, error } = useSWR<WeatherData>("/api/weather", fetcher, {
    refreshInterval: 30 * 60 * 1000, // 30 min
    revalidateOnFocus: false,
  });

  if (error || !data || "error" in data) {
    return null; // silent failure — weather is supplementary
  }

  const { emoji, label } = describeWeather(data.current.weatherCode, data.current.isDay);

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-800/60">
      <span className="text-2xl leading-none">{emoji}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-white font-bold text-lg tabular-nums">
          {data.current.temperature}°C
        </span>
        <span className="text-slate-400 text-xs">{label}</span>
      </div>
    </div>
  );
}
