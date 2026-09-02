# Weather Forecast Platform

A responsive React + Vite weather dashboard powered by OpenWeather.

## Features

- Search weather by city
- Live current-location weather using browser geolocation
- Current temperature, conditions, high/low, wind and location
- 5-day forecast with precipitation probability
- Air-quality index and pollutant readings
- Sunrise and sunset
- Humidity, pressure, visibility, feels-like temperature, cloud cover and wind details
- Dynamic weather themes and responsive layout

## Setup

1. Install dependencies:
   `npm install`
2. Create a `.env` file in the project root.
3. Add your OpenWeather key:
   `VITE_API_KEY=YOUR_OPENWEATHER_API_KEY`
4. Start the app:
   `npm run dev`

Current-location access works on `localhost` during development and requires HTTPS when deployed. The browser will ask the user for location permission.

## Search assistance
Typing at least two letters in the city search displays up to five OpenWeather geocoding suggestions with city, state/region, and country. Selecting a suggestion loads weather using its exact coordinates. Error banners automatically dismiss after 5 seconds.
