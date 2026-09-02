import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import Navbar from "./components/navbar";
import MainWeatherCard from "./components/mainweathercard";
import FiveDayForecast from "./components/fiveday";
import TodayHighlights from "./components/todayhighlights";
import "./index.css";

const API_BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_API_URL = "https://api.openweathermap.org/geo/1.0/direct";

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
  const leftColumnRef = useRef(null);
  const [desktopColumnHeight, setDesktopColumnHeight] = useState(null);

  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    if (!error) return undefined;

    const timer = window.setTimeout(() => {
      setError("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error]);

  useLayoutEffect(() => {
    const leftColumn = leftColumnRef.current;
    if (!leftColumn) return undefined;

    const syncColumnHeight = () => {
      if (window.innerWidth >= 1121) {
        setDesktopColumnHeight(Math.ceil(leftColumn.getBoundingClientRect().height));
      } else {
        setDesktopColumnHeight(null);
      }
    };

    syncColumnHeight();
    const observer = new ResizeObserver(syncColumnHeight);
    observer.observe(leftColumn);
    window.addEventListener("resize", syncColumnHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncColumnHeight);
    };
  }, [weatherData, fiveDayForecast]);

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

  const fetchWeatherByCoordinates = async (lat, lon, source = "location") => {
    if (!API_KEY) {
      setError("Missing VITE_API_KEY. Add your OpenWeather key to the project .env file.");
      return;
    }

    setLoading(true);
    if (source === "location") setLocationLoading(true);
    setError("");
    setLastRequest({ type: "coords", value: { lat, lon, source } });

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
      if (source === "location") setLocationLoading(false);
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
        fetchWeatherByCoordinates(coords.latitude, coords.longitude, "location");
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

  const fetchCitySuggestions = async (query) => {
    if (!API_KEY || query.trim().length < 2) return [];

    try {
      const response = await fetch(
        `${GEO_API_URL}?q=${encodeURIComponent(query.trim())}&limit=5&appid=${API_KEY}`
      );

      if (!response.ok) return [];
      const places = await response.json();
      const seen = new Set();

      return places
        .map((place) => {
          const parts = [place.name, place.state, place.country].filter(Boolean);
          const label = parts.join(", ");
          const detail = [place.state, place.country].filter(Boolean).join(", ");
          return {
            name: place.name,
            state: place.state || "",
            country: place.country || "",
            lat: place.lat,
            lon: place.lon,
            label,
            detail,
          };
        })
        .filter((place) => {
          const key = `${place.name}|${place.state}|${place.country}|${place.lat.toFixed(3)}|${place.lon.toFixed(3)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    } catch (suggestionError) {
      console.error("Error fetching city suggestions:", suggestionError);
      return [];
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    fetchWeatherByCoordinates(suggestion.lat, suggestion.lon, "suggestion");
  };

  const retryLastRequest = () => {
    if (lastRequest.type === "coords") {
      fetchWeatherByCoordinates(lastRequest.value.lat, lastRequest.value.lon, lastRequest.value.source || "retry");
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
          onGetSuggestions={fetchCitySuggestions}
          onSelectSuggestion={handleSuggestionSelect}
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
              <div className="left-column" ref={leftColumnRef}>
                <MainWeatherCard weatherData={weatherData} />
                {fiveDayForecast && <FiveDayForecast forecastData={fiveDayForecast} />}
              </div>

              {airQualityData && (
                <div
                  className="highlights-slot"
                  style={desktopColumnHeight ? { height: `${desktopColumnHeight}px` } : undefined}
                >
                  <TodayHighlights
                    weatherData={weatherData}
                    airQualityData={airQualityData}
                    forecastData={fiveDayForecast}
                  />
                </div>
              )}
            </section>
          )
        )}
      </div>
    </main>
  );
};

export default WeatherDashboard;
