import { useMemo, useState, useEffect } from "react";
import Navbar from "./components/navbar";
import MainWeatherCard from "./components/mainweathercard";
import FiveDayForecast from "./components/fiveday";
import TodayHighlights from "./components/todayhighlights";
import "./index.css";

const API_BASE_URL = "https://api.openweathermap.org/data/2.5";

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

const getApiErrorMessage = (status, fallback = "Unable to load weather data right now.") => {
  if (status === 401) return "Weather API key is invalid or not active yet.";
  if (status === 404) return "City not found. Please check the spelling and try again.";
  if (status === 429) return "Weather API request limit reached. Please try again later.";
  return fallback;
};

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [fiveDayForecast, setFiveDayForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRequest, setLastRequest] = useState({ type: "city", value: "Andhra Pradesh" });

  const API_KEY = import.meta.env.VITE_API_KEY;

  const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(getApiErrorMessage(response.status));
    }
    return response.json();
  };

  const fetchRelatedWeatherData = async (lat, lon) => {
    const [airQuality, forecast] = await Promise.all([
      fetchJson(`${API_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
      fetchJson(`${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
    ]);

    setAirQualityData(airQuality.list?.[0] || null);
    setFiveDayForecast(forecast);
  };

  const fetchWeatherByCity = async (cityName) => {
    if (!API_KEY) {
      setError("Missing VITE_API_KEY. Add your OpenWeather key to the project .env file.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setLastRequest({ type: "city", value: cityName });

    try {
      const weather = await fetchJson(
        `${API_BASE_URL}/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(weather);
      await fetchRelatedWeatherData(weather.coord.lat, weather.coord.lon);
    } catch (fetchError) {
      console.error("Error fetching weather data:", fetchError);
      setError(fetchError.message || "Unable to load weather data right now.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoordinates = async (lat, lon) => {
    if (!API_KEY) {
      setError("Missing VITE_API_KEY. Add your OpenWeather key to the project .env file.");
      return;
    }

    setLoading(true);
    setLocationLoading(true);
    setError("");
    setLastRequest({ type: "coords", value: { lat, lon } });

    try {
      const weather = await fetchJson(
        `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(weather);
      await fetchRelatedWeatherData(lat, lon);
    } catch (fetchError) {
      console.error("Error fetching current-location weather:", fetchError);
      setError(fetchError.message || "Unable to load weather for your current location.");
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherByCity("Andhra Pradesh");
    // The initial request should run once when the dashboard opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Current location is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetchWeatherByCoordinates(coords.latitude, coords.longitude);
      },
      (geoError) => {
        setLocationLoading(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location permission was denied. Allow location access in your browser and try again.");
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setError("Your current location could not be determined.");
        } else if (geoError.code === geoError.TIMEOUT) {
          setError("Location request timed out. Please try again.");
        } else {
          setError("Unable to access your current location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const retryLastRequest = () => {
    if (lastRequest.type === "coords") {
      fetchWeatherByCoordinates(lastRequest.value.lat, lastRequest.value.lon);
    } else {
      fetchWeatherByCity(lastRequest.value);
    }
  };

  const theme = useMemo(() => getWeatherTheme(weatherData), [weatherData]);

  return (
    <main className={`weather-app theme-${theme}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="app-shell">
        <Navbar
          onSearch={fetchWeatherByCity}
          onCurrentLocation={handleCurrentLocation}
          locationLoading={locationLoading}
        />

        {error && (
          <div className="status-card error-card" role="alert">
            <div>
              <span className="status-eyebrow">Weather unavailable</span>
              <strong>{error}</strong>
            </div>
            <button type="button" onClick={retryLastRequest}>
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
          weatherData && (
            <section className="dashboard-grid">
              <div className="left-column">
                <MainWeatherCard weatherData={weatherData} />
                {fiveDayForecast && <FiveDayForecast forecastData={fiveDayForecast} />}
              </div>

              {airQualityData && (
                <TodayHighlights
                  weatherData={weatherData}
                  airQualityData={airQualityData}
                  forecastData={fiveDayForecast}
                />
              )}
            </section>
          )
        )}
      </div>
    </main>
  );
};

export default WeatherDashboard;
