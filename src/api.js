const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const WMO = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Violent showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm, hail", "⛈️"],
  99: ["Thunderstorm, hail", "⛈️"],
};

export const describe = (code) => WMO[code] ?? ["Unknown", "❓"];

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.reason);
  return data;
}

export function getPosition() {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(new Error(e.message)),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  );
}

export async function reverseGeocode(lat, lon) {
  const coords = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  try {
    const d = await getJSON(
      `${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const parts = [d.city || d.locality, d.principalSubdivision].filter(Boolean);
    return parts.length ? parts.join(", ") : `Near ${coords}`;
  } catch {
    return `Near ${coords}`;
  }
}

export async function searchCity(name) {
  const d = await getJSON(
    `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
  );
  const r = d.results?.[0];
  if (!r) throw new Error("City not found");
  return {
    name: r.name,
    country: [r.admin1, r.country].filter(Boolean).join(", "),
    lat: r.latitude,
    lon: r.longitude,
  };
}

// Multiple matches, so the user can pick the right city.
export async function searchCities(name) {
  const d = await getJSON(
    `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=8&language=en&format=json`
  );
  return (d.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(", "),
    lat: r.latitude,
    lon: r.longitude,
  }));
}

// Zero-config shortcuts, so the picker is useful before any search.
export const POPULAR_CITIES = [
  { id: "lon", name: "London", region: "England, United Kingdom", lat: 51.5072, lon: -0.1276 },
  { id: "nyc", name: "New York", region: "New York, United States", lat: 40.7128, lon: -74.006 },
  { id: "tok", name: "Tokyo", region: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { id: "syd", name: "Sydney", region: "New South Wales, Australia", lat: -33.8688, lon: 151.2093 },
  { id: "par", name: "Paris", region: "Ile-de-France, France", lat: 48.8566, lon: 2.3522 },
  { id: "dxb", name: "Dubai", region: "Dubai, United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { id: "sin", name: "Singapore", region: "Singapore", lat: 1.3521, lon: 103.8198 },
  { id: "sf", name: "San Francisco", region: "California, United States", lat: 37.7749, lon: -122.4194 },
  { id: "ber", name: "Berlin", region: "Berlin, Germany", lat: 52.52, lon: 13.405 },
  { id: "mum", name: "Mumbai", region: "Maharashtra, India", lat: 19.076, lon: 72.8777 },
];

export async function getWeather(lat, lon) {
  const p = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
  });
  const d = await getJSON(`${FORECAST_URL}?${p}`);
  return { ...d, lat, lon };
}
