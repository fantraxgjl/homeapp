// Open-Meteo weather client — no API key required
// Docs: https://open-meteo.com/en/docs

export interface CurrentWeather {
  temperature: number;       // °C
  weatherCode: number;       // WMO code
  windSpeed: number;         // km/h
  isDay: boolean;
}

export interface HourlyForecast {
  time: string;              // ISO
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface DailyForecast {
  date: string;              // YYYY-MM-DD
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];  // next 12 hours
  daily: DailyForecast[];    // next 7 days
  fetchedAt: number;         // timestamp
}

// WMO Weather code → emoji + description
export function describeWeather(code: number, isDay = true): { emoji: string; label: string } {
  if (code === 0)                        return { emoji: isDay ? "☀️" : "🌙", label: "Clear" };
  if (code === 1)                        return { emoji: isDay ? "🌤️" : "🌙", label: "Mainly clear" };
  if (code === 2)                        return { emoji: "⛅", label: "Partly cloudy" };
  if (code === 3)                        return { emoji: "☁️", label: "Overcast" };
  if (code >= 45 && code <= 48)          return { emoji: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 57)          return { emoji: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 65)          return { emoji: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77)          return { emoji: "❄️", label: "Snow" };
  if (code >= 80 && code <= 82)          return { emoji: "🌦️", label: "Showers" };
  if (code >= 85 && code <= 86)          return { emoji: "🌨️", label: "Snow showers" };
  if (code >= 95 && code <= 99)          return { emoji: "⛈️", label: "Thunderstorm" };
  return { emoji: "🌡️", label: "Unknown" };
}

// In-memory cache (30 min TTL)
let _cache: WeatherData | null = null;
const CACHE_TTL = 30 * 60 * 1000;

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) {
    return _cache;
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,is_day");
  url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("wind_speed_unit", "kmh");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data = await res.json();

  const now = new Date();
  const currentHourIndex = data.hourly.time.findIndex(
    (t: string) => new Date(t) > now
  );
  const sliceStart = Math.max(0, currentHourIndex);

  const weather: WeatherData = {
    current: {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      windSpeed: Math.round(data.current.wind_speed_10m),
      isDay: data.current.is_day === 1,
    },
    hourly: data.hourly.time
      .slice(sliceStart, sliceStart + 12)
      .map((time: string, i: number) => ({
        time,
        temperature: Math.round(data.hourly.temperature_2m[sliceStart + i]),
        weatherCode: data.hourly.weather_code[sliceStart + i],
        precipitationProbability: data.hourly.precipitation_probability[sliceStart + i],
      })),
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      weatherCode: data.daily.weather_code[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
    })),
    fetchedAt: Date.now(),
  };

  _cache = weather;
  return weather;
}
