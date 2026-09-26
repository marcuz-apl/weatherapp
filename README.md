# Weather App

Live weather for your current city (or any city you search), with an interactive OpenStreetMap. React + Vite + Tailwind CSS. No API keys, no backend, no database.

## Screen shot

![Skyline Weather](./weather-app-ui.png)

## Run

```sh
npm install
npm run dev      # http://localhost:5173
```

```sh
npm run build && npm run preview   # production build
```

## Features

- Detects your city via browser geolocation, reverse-geocoded to a place name
- Live conditions: temperature, feels like, humidity, wind, pressure, rain, local time
- Next 12 hours (temperature, condition, precipitation probability)
- 7-day forecast with highs/lows and rain chance
- City search
- Click the map to load weather for any spot
- Last location remembered in `localStorage`

## Stack

| Concern    | Choice                                                |
| ---------- | ----------------------------------------------------- |
| UI         | React 18, Tailwind CSS 4 (Vite plugin)                 |
| Map        | Leaflet + react-leaflet, OpenStreetMap tiles           |
| Weather    | Open-Meteo forecast & geocoding APIs (no key)          |
| Reverse geo| BigDataCloud reverse geocode client                    |
| State      | `useState` + `localStorage` (no server, no sqlite)    |

## Layout

```
index.html
src/main.jsx      entry
src/App.jsx       state, geolocation, search, panels
src/Map.jsx       map, marker, click-to-select
src/api.js        fetch + WMO code descriptions
src/index.css     tailwind import
```

## Notes

- Geolocation requires a secure context: `localhost` or HTTPS.
- Tiles and forecasts are fetched from third parties; an offline client shows an error.

## Guide to Use Moderado

[The Guide to Moderado](./How-to-Use-Moderado-to-develop-apps.md)

## License

MIT
