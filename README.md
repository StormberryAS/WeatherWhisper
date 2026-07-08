# WeatherWhisper

Hyper-local offline micro-forecasts. WeatherWhisper deterministically generates a mathematically modeled 24-hour "feels-like" temperature curve for over 2,000 cities offline by interpolating a localized climate model—no external API calls required.

**Live:** [whisper.stormberry.as](https://whisper.stormberry.as)

## Features
- **Offline Interpolation**: Uses a deterministic mathematical climate model based on latitude and solar position to estimate a standard diurnal temperature curve.
- **Fluid Temperature Background**: The background gradient dynamically shifts from cool blues to warm reds as you scrub through the 24-hour chart.
- **Responsive Layout**: Optimized for mobile and desktop with a cinematic dark glassmorphism theme.
- **Stormberry Ecosystem**: Uses the identical 2,000+ city database powering `SunApp` and `MoonApp`.

## Architecture
- **Vanilla HTML/CSS/JS**, no frameworks, no build step.
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
