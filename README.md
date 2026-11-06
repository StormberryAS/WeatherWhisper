# WeatherWhisper

Modelled temperatures for more than 24,000 cities. WeatherWhisper estimates the temperature for a city, a date and an hour from a simple deterministic model of latitude, season and time of day. It runs in your browser and makes no external API calls. It has no offline mode (no service worker): without a connection the page opens only while the browser's short cache still holds it.

**Live:** [weather.stormberry.as](https://weather.stormberry.as)

## Features
- **Deterministic model**: the daily mean comes from the latitude and the day of the year (warmest around 21 July in the north and around 20 January in the south), and the hour adds a daily swing that peaks at 15:00 and is lowest at 03:00. There is no random part: the same city, date and hour give the same figure in the same time zone (the day of the year follows the time zone of your device).
- **Time of day**: a slider with one step per hour, from 12:00 AM to 11:00 PM, for one date.
- **Date range**: choose an end date after the start date and the page lists the modelled low (03:00) and high (15:00) for each day, up to 30 days.
- **Temperature background**: the background gradient shifts from cool blues to warm reds with the temperature shown, as you move the time-of-day slider or change the dates.
- **Responsive Layout**: Optimised for mobile and desktop with a cinematic dark glassmorphism theme.
- **Stormberry Labs city catalogue**: the same `cities.js` as SunApp, MoonApp and the other Labs apps, byte for byte: 25,007 places, from GeoNames plus a short hand-kept list of local places (the Askøy places come from Kartverket). The search lists them as "City, Country"; where two places share that name, WeatherWhisper uses the first.

## Architecture
- **Vanilla HTML and CSS, TypeScript**, no frameworks.
- **TypeScript source in `ts/`, compiled JavaScript committed.** `ts/app.ts` compiles to `app.js`, at the same path the page has always loaded, as a classic script (no modules). The compiled file is committed because GitHub Pages serves the repository as it is, with no build step of its own; `.gitattributes` marks it as generated. Edit the TypeScript, never the `.js`.
- **Generated files kept as they are.** `cities.js` is the shared Stormberry Labs city catalogue, written by SunApp's `update_cities.py`; `ts/cities.d.ts` types it for the TypeScript. `gate.js` and `gate.css`, the first-run notice, are written by the shared `build-gates.py`. None of them is edited here.
- **Build:** `npm run build` (`tools/build-ts.sh`) installs the pinned compiler (`npm ci`), compiles, then runs `bump_assets.py` to restamp the `?v=` cache stamps. `npm run check` changes nothing and fails when the committed JavaScript is not what the TypeScript compiles to. `npm test` runs the tests in `tests/` with the test runner built into Node 24. The published app has no runtime dependencies.
- **Privacy First**, no cookies, no tracking. Zero external API calls.
- Stormberry dark-mode glassmorphism design system, Inter typography.
- **Sovereign AI**, built and maintained using high-speed agentic workflows.

## Local development
```bash
git clone https://github.com/StormberryAS/WeatherWhisper.git
cd WeatherWhisper
python3 -m http.server 3006
```
Open `http://localhost:3006` in your browser.

## Credits
Built by [Stormberry AS](https://stormberry.as). Proudly powered by sovereign AI agents.

## Disclaimer

Supplied free of charge, **as is**, with no warranty of any kind. Using it creates no client or advisory relationship with Stormberry AS, and nothing it produces is professional advice.

**The forecasts in WeatherWhisper are modelled, not observed.** They are generated from latitude, the day of the year and the hour by a simple deterministic model that runs in your browser. No weather station, satellite or forecast service is consulted, and the figures bear no relation to actual conditions where you are. For a real forecast use [MET Norway / Yr](https://www.yr.no/) or your national service.

This is a **functioning prototype**, not a certified instrument and not a professional service. **Its readings are simulated and are not real data.** Do not use it as a source for any decision at all. Stormberry AS reimburses no cost or loss arising from use of this application.

Full terms: [DISCLAIMER.md](DISCLAIMER.md).
