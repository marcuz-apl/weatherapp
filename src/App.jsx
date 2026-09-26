import { useCallback, useEffect, useState } from "react";
import Map from "./Map.jsx";
import {
  POPULAR_CITIES,
  describe,
  getPosition,
  getWeather,
  reverseGeocode,
  searchCity,
  searchCities,
} from "./api.js";

const LAST = "weather-app:last";
const isTouch = () => window.matchMedia("(hover: none)").matches;

export default function App() {
  const [place, setPlace] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LAST));
    } catch {
      return null;
    }
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapLive, setMapLive] = useState(() => !isTouch());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matching, setMatching] = useState(false);

  const load = useCallback(async (loc, label) => {
    setLoading(true);
    setError("");
    try {
      const w = await getWeather(loc.lat, loc.lon);
      setData(w);
      setPlace({ ...loc, name: label });
      localStorage.setItem(LAST, JSON.stringify({ ...loc, name: label }));
      return w;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (place) load(place, place.name);
    else
      (async () => {
        try {
          const { lat, lon } = await getPosition();
          const name = await reverseGeocode(lat, lon);
          load({ lat, lon }, name);
        } catch {
          load({ lat: 51.5074, lon: -0.1278 }, "London");
        }
      })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locate = async () => {
    setError("");
    try {
      const { lat, lon } = await getPosition();
      const name = await reverseGeocode(lat, lon);
      load({ lat, lon }, name);
    } catch (e) {
      setError(e.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const c = await searchCity(query.trim());
      await load(c, `${c.name}, ${c.country}`);
      setQuery("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Click a city to load its weather.
  const pickCity = (city) => {
    setPickerOpen(false);
    setQuery("");
    load(city, `${city.name}, ${city.region}`);
  };

  // Tap the map: load weather there and name the place by reverse geocoding.
  const pickOnMap = async (lat, lon) => {
    const w = await load({ lat, lon }, "Loading…");
    if (!w) return;
    const name = await reverseGeocode(lat, lon);
    load({ lat, lon }, name);
  };

  // Live suggestions as the user types.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || !pickerOpen) {
      setMatches([]);
      return;
    }
    setMatching(true);
    const id = setTimeout(async () => {
      try {
        setMatches(await searchCities(q));
      } catch {
        setMatches([]);
      } finally {
        setMatching(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query, pickerOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-[1100] border-b border-white/5 bg-slate-950/80 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-4 sm:pb-4 sm:pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3">
          <h1 className="mr-auto text-lg font-semibold tracking-tight sm:text-xl">
            Skyline Weather
          </h1>
          <form onSubmit={submit} className="flex min-w-0 flex-1 gap-2 sm:flex-none">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city…"
              enterKeyHint="search"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-base outline-none transition focus:border-sky-400/60 focus:bg-white/10 sm:w-44 sm:py-2 sm:text-sm"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15 sm:px-4 sm:py-2"
            >
              Search
            </button>
          </form>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-white/15 sm:py-2"
          >
            🏙️<span className="hidden lg:inline">Cities</span>
          </button>
          <button
            onClick={locate}
            aria-label="Use my location"
            className="flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-white/15 sm:py-2"
          >
            📍<span className="hidden lg:inline">Locate me</span>
          </button>
        </div>
      </header>

      {error && (
        <p className="mx-auto mt-3 max-w-7xl rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <main className="flex-1 p-3 sm:p-4">
        {/* 2x2 on desktop: map | dash, then hourly | days.
            DOM order already matches the required mobile order. */}
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            {place && (
              <Map
                lat={place.lat}
                lon={place.lon}
                name={place.name}
                onPick={pickOnMap}
                interactive={mapLive}
              />
            )}
            <button
              onClick={() => setMapLive((v) => !v)}
              aria-pressed={mapLive}
              className="absolute left-1/2 top-3 z-[500] flex min-h-[44px] -translate-x-1/2 items-center whitespace-nowrap rounded-full border border-white/15 bg-slate-950/80 px-4 text-xs font-medium text-slate-200 shadow-lg backdrop-blur-md transition active:scale-95"
            >
              {mapLive ? "🔒 Pan off · tap a spot" : "🗺️ Tap a spot · drag to pan"}
            </button>
          </div>

          {data ? (
            <>
              <Current data={data} name={place?.name} />
              <Hourly data={data} grow />
              <Daily data={data} grow />
            </>
          ) : (
            <p className="text-sm text-slate-400">
              {loading ? "Loading weather…" : "No data"}
            </p>
          )}
        </div>
      </main>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setPickerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pick a city"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-3xl border border-white/10 bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-base font-semibold">Pick a city</h2>
              <button
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain p-2">
              {query.trim().length >= 2 ? (
                matching && !matches.length ? (
                  <p className="p-4 text-center text-sm text-slate-500">Searching…</p>
                ) : matches.length ? (
                  <ul className="grid gap-1">
                    {matches.map((c) => (
                      <li key={c.id}>
                        <CityRow city={c} onPick={pickCity} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-center text-sm text-slate-500">No cities found</p>
                )
              ) : (
                <>
                  <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Popular cities
                  </p>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {POPULAR_CITIES.map((c) => (
                      <li key={c.id}>
                        <CityRow city={c} onPick={pickCity} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/5 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-center sm:px-4">
        <p className="text-xs text-slate-500">
          A demo product built with{" "}
          <span className="font-medium text-slate-300">Moderado</span>
        </p>
      </footer>
    </div>
  );
}

function CityRow({ city, onPick }) {
  return (
    <button
      onClick={() => onPick(city)}
      className="flex w-full min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/10 active:bg-white/15"
    >
      <span className="shrink-0 text-lg">📍</span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{city.name}</span>
        <span className="block truncate text-xs text-slate-500">{city.region}</span>
      </span>
    </button>
  );
}

function Current({ data, name }) {
  const c = data.current;
  const [text, icon] = describe(c.weather_code);
  return (
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 p-5 shadow-lg shadow-sky-950/40 sm:p-6 lg:h-full lg:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute right-2 top-2 h-40 w-40 rounded-full bg-white/10 blur-2xl"
      />
      <p className="relative truncate text-base font-medium text-sky-100/90">
        {name}
      </p>

      {/* Fills the square: readout centred, chips spread over the full width. */}
      <div className="relative flex flex-1 flex-col justify-center py-4">
        <div className="flex items-center gap-4">
          <span className="shrink-0 text-7xl leading-none drop-shadow-sm lg:text-8xl">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-6xl font-semibold leading-none tracking-tight lg:text-7xl">
              {Math.round(c.temperature_2m)}°
            </p>
            <p className="mt-2 text-base text-sky-100/90">{text}</p>
          </div>
        </div>
      </div>

      <dl className="relative grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Stat label="Feels like" value={`${Math.round(c.apparent_temperature)}°C`} />
        <Stat label="Humidity" value={`${c.relative_humidity_2m}%`} />
        <Stat label="Wind" value={`${Math.round(c.wind_speed_10m)} km/h`} />
        <Stat label="Pressure" value={`${Math.round(c.surface_pressure)} hPa`} />
        <Stat label="Rain now" value={`${c.precipitation} mm`} />
        <Stat label="Local time" value={c.time.slice(11, 16)} />
      </dl>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-black/20 px-3 py-2.5 ring-1 ring-white/10 lg:px-4 lg:py-3">
      <dt className="truncate text-[11px] font-medium uppercase tracking-wider text-sky-100/70">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-lg font-semibold tabular-nums lg:text-xl">
        {value}
      </dd>
    </div>
  );
}

function Hourly({ data, grow }) {
  const now = new Date().getTime();
  const start = data.hourly.time.findIndex(
    (t) => new Date(t).getTime() >= now - 3600e3
  );
  const idx = Math.max(0, start === -1 ? 0 : start);
  const hours = data.hourly.time.slice(idx, idx + 12);
  return (
    <div
      className={`min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${
        grow ? "flex flex-col" : ""
      }`}
    >
      <h2 className="text-sm font-semibold tracking-wide text-slate-300">
        Next 12 hours
      </h2>
      <div
        className={`-mx-1 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 ${
          grow ? "flex-1" : ""
        }`}
      >
        {hours.map((t, i) => {
          const k = idx + i;
          const [text, icon] = describe(data.hourly.weather_code[k]);
          return (
            <div
              key={t}
              className="w-[3.75rem] shrink-0 snap-start rounded-2xl bg-white/5 px-1 py-2.5 text-center text-xs ring-1 ring-white/5 lg:w-[3.5rem] max-[380px]:w-12"
            >
              <p className="text-[11px] tabular-nums text-slate-400">
                {t.slice(11, 16)}
              </p>
              <p className="my-1.5 text-2xl leading-none">{icon}</p>
              <p className="text-sm font-semibold tabular-nums">
                {Math.round(data.hourly.temperature_2m[k])}°
              </p>
              <p className="text-[11px] tabular-nums text-sky-300">
                {data.hourly.precipitation_probability[k]}%
              </p>
              <p className="mt-0.5 hidden truncate text-[10px] text-slate-500 sm:block">
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Daily({ data, grow }) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${
        grow ? "flex flex-col" : ""
      }`}
    >
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-300">
        7-day forecast
      </h2>
      <ul className={`mt-2 space-y-1.5 ${grow ? "flex flex-1 flex-col justify-between" : ""}`}>
        {data.daily.time.map((t, i) => {
          const [text, icon] = describe(data.daily.weather_code[i]);
          return (
            <li
              key={t}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm odd:bg-white/[0.03]"
            >
              <span className="w-14 shrink-0 text-slate-400 sm:w-16">
                {i === 0 ? "Today" : new Date(t).toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span className="w-5 shrink-0 sm:w-6">{icon}</span>
              <span className="hidden min-w-0 flex-1 truncate text-slate-300 md:block">
                {text}
              </span>
              <span className="ml-auto shrink-0 text-sky-300 sm:ml-0">
                {data.daily.precipitation_probability_max[i]}%
              </span>
              <span className="w-20 shrink-0 text-right sm:w-24">
                <b>{Math.round(data.daily.temperature_2m_max[i])}°</b>{" "}
                <span className="text-slate-500">
                  {Math.round(data.daily.temperature_2m_min[i])}°
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
