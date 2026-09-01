import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "./components/navbar";
import MainWeatherCard from "./components/mainweathercard";
import FiveDayForecast from "./components/fiveday";
import TodayHighlights from "./components/todayhighlights";
import "./index.css";

const getWeatherTheme = (weatherData) => {
  const condition = weatherData?.weather?.[0]?.main?.toLowerCase() || "default";
  const icon = weatherData?.weather?.[0]?.icon || "";
  const isNight = icon.endsWith("n");

  if (isNight) return "night";
  if (condition.includes("thunder")) return "storm";
  if (condition.includes("rain") || condition.includes("drizzle")) return "rain";
  if (condition.includes("snow")) return "snow";
  if (condition.includes("cloud")) return "clouds";
  if (condition.includes("clear")) return "clear";
  if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) return "mist";
  return "default";
};

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [city, setCity] = useState("Andhra Pradesh");
  const [airQualityData, setAirQualityData] = useState(null);
  const [fiveDayForecast, setFiveDayForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeatherData(city);
  }, [city]);

  const fetchAirQualityData = async (lat, lon) => {
    const API_KEY = import.meta.env.VITE_API_KEY;
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    setAirQualityData(response.data.list[0]);
  };

  const fetchWeatherData = async (cityName) => {
    const API_KEY = import.meta.env.VITE_API_KEY;
    setLoading(true);
    setError("");

    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${API_KEY}`
      );

      if (!weatherResponse.ok) {
        throw new Error("City not found. Please check the spelling and try again.");
      }

      const data = await weatherResponse.json();
      setWeatherData(data);

      await Promise.all([
        fetchAirQualityData(data.coord.lat, data.coord.lon),
        axios
          .get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&units=metric&appid=${API_KEY}`
          )
          .then((response) => setFiveDayForecast(response.data)),
      ]);
    } catch (fetchError) {
      console.error("Error fetching weather data:", fetchError);
      setError(fetchError.message || "Unable to load weather data right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchedCity) => {
    setCity(searchedCity);
  };

  const theme = useMemo(() => getWeatherTheme(weatherData), [weatherData]);

  return (
    <main className={`weather-app theme-${theme}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="app-shell">
        <Navbar onSearch={handleSearch} currentCity={weatherData?.name || city} />

        {error && (
          <div className="status-card error-card" role="alert">
            <div>
              <span className="status-eyebrow">Search unavailable</span>
              <strong>{error}</strong>
            </div>
            <button type="button" onClick={() => fetchWeatherData(city)}>
              Try again
            </button>
          </div>
        )}

        {loading && !weatherData ? (
          <section className="dashboard-grid" aria-label="Loading weather data">
            <div className="left-column">
              <div className="skeleton skeleton-hero" />
              <div className="skeleton skeleton-forecast" />
            </div>
            <div className="skeleton skeleton-highlights" />
          </section>
        ) : (
          weatherData &&
          airQualityData && (
            <section className="dashboard-grid">
              <div className="left-column">
                <MainWeatherCard weatherData={weatherData} />
                {fiveDayForecast && <FiveDayForecast forecastData={fiveDayForecast} />}
              </div>

              <TodayHighlights weatherData={weatherData} airQualityData={airQualityData} />
            </section>
          )
        )}

        <footer className="app-footer">
          <span>Weather Dashboard</span>
          <span className="footer-dot">•</span>
          <span>Live conditions powered by OpenWeather</span>
        </footer>
      </div>
    </main>
  );
};

export default WeatherDashboard;
