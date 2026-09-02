import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import Navbar from "./components/navbar";
import MainWeatherCard from "./components/mainweathercard";
import FiveDayForecast from "./components/fiveday";
import TodayHighlights from "./components/todayhighlights";
import "./index.css";

const API_BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEO_API_URL = "https://api.openweathermap.org/geo/1.0/reverse";
const WEATHER_CACHE_KEY = "weather-dashboard-cache-v1";
const WEATHER_CACHE_MAX_AGE = 6 * 60 * 60 * 1000;

const readWeatherCache = () => {
  try {
    const raw = window.localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.savedAt || Date.now() - cached.savedAt > WEATHER_CACHE_MAX_AGE) {
      window.localStorage.removeItem(WEATHER_CACHE_KEY);
      return null;
    }
    if (!cached.weatherData) return null;
    return cached;
  } catch {
    return null;
  }
};

const writeWeatherCache = (payload) => {
  try {
    window.localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch {
    // Storage can be unavailable in private/restricted browser modes.
  }
};

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
  const initialCacheRef = useRef(readWeatherCache());
  const initialCache = initialCacheRef.current;
  const [weatherData, setWeatherData] = useState(initialCache?.weatherData || null);
  const [airQualityData, setAirQualityData] = useState(initialCache?.airQualityData || null);
  const [fiveDayForecast, setFiveDayForecast] = useState(initialCache?.fiveDayForecast || null);
  const [loading, setLoading] = useState(!initialCache?.weatherData);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRequest, setLastRequest] = useState({ type: "city", value: "Andhra Pradesh" });
  const [locationDetails, setLocationDetails] = useState(initialCache?.locationDetails || null);
  const leftColumnRef = useRef(null);
  const initialLocationAttemptedRef = useRef(false);
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
        setDesktopColumnHeight(leftColumn.getBoundingClientRect().height);
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

    const airQualityItem = airQuality.list?.[0] || null;
    setAirQualityData(airQualityItem);
    setFiveDayForecast(forecast);
    return { airQualityData: airQualityItem, fiveDayForecast: forecast };
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const places = await fetchJson(
        `${REVERSE_GEO_API_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
      );
      const place = places?.[0];
      if (!place) return null;
      return {
        name: place.name || "",
        state: place.state || "",
        country: place.country || "",
      };
    } catch (reverseError) {
      console.warn("Reverse geocoding failed:", reverseError);
      return null;
    }
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
      const matches = await fetchCitySuggestions(cityName);
      if (matches.length > 0) {
        const match = matches[0];
        const weather = await fetchJson(
          `${API_BASE_URL}/weather?lat=${match.lat}&lon=${match.lon}&units=metric&appid=${API_KEY}`
        );
        const details = { name: match.name, state: match.state, country: match.country };
        setWeatherData(weather);
        setLocationDetails(details);
        const related = await fetchRelatedWeatherData(match.lat, match.lon);
        writeWeatherCache({
          weatherData: weather,
          locationDetails: details,
          ...related,
          coords: { lat: match.lat, lon: match.lon },
        });
      } else {
        const weather = await fetchJson(
          `${API_BASE_URL}/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${API_KEY}`
        );
        setWeatherData(weather);
        const resolvedDetails = await reverseGeocode(weather.coord.lat, weather.coord.lon);
        const details = resolvedDetails || { name: weather.name, state: "", country: weather.sys?.country || "" };
        setLocationDetails(details);
        const related = await fetchRelatedWeatherData(weather.coord.lat, weather.coord.lon);
        writeWeatherCache({
          weatherData: weather,
          locationDetails: details,
          ...related,
          coords: { lat: weather.coord.lat, lon: weather.coord.lon },
        });
      }
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
      const resolvedDetails = await reverseGeocode(lat, lon);
      const details = resolvedDetails || { name: weather.name, state: "", country: weather.sys?.country || "" };
      setLocationDetails(details);
      const related = await fetchRelatedWeatherData(lat, lon);
      writeWeatherCache({
        weatherData: weather,
        locationDetails: details,
        ...related,
        coords: { lat, lon },
      });
    } catch (fetchError) {
      console.error("Error fetching current-location weather:", fetchError);
      setError(fetchError.message || "Unable to load weather for your current location.");
    } finally {
      setLoading(false);
      if (source === "location") setLocationLoading(false);
    }
  };

  const getBestCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("UNSUPPORTED"));
        return;
      }

      let bestPosition = null;
      let finished = false;
      let watchId = null;
      let timer = null;

      const cleanup = () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        if (timer !== null) window.clearTimeout(timer);
      };

      const finishWithBest = () => {
        if (finished) return;
        finished = true;
        cleanup();
        if (bestPosition) resolve(bestPosition);
        else reject(new Error("POSITION_UNAVAILABLE"));
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }
          if (position.coords.accuracy <= 1000) finishWithBest();
        },
        (geoError) => {
          if (finished) return;
          finished = true;
          cleanup();
          reject(geoError);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );

      timer = window.setTimeout(finishWithBest, 12000);
    });

  useEffect(() => {
    if (initialLocationAttemptedRef.current) return;
    initialLocationAttemptedRef.current = true;

    const loadInitialWeather = async () => {
      if (!API_KEY) {
        setError("Missing VITE_API_KEY. Add your OpenWeather key to the project .env file.");
        setLoading(false);
        return;
      }

      if (!navigator.geolocation) {
        await fetchWeatherByCity("Andhra Pradesh");
        return;
      }

      const hasCachedDashboard = Boolean(initialCacheRef.current?.weatherData);
      if (!hasCachedDashboard) setLocationLoading(true);
      setError("");

      try {
        const position = await getBestCurrentPosition();
        const { latitude, longitude } = position.coords;
        await fetchWeatherByCoordinates(
          latitude,
          longitude,
          hasCachedDashboard ? "background-location" : "initial-location"
        );
      } catch (geoError) {
        console.warn("Initial location unavailable:", geoError);
        if (!hasCachedDashboard) {
          await fetchWeatherByCity("Andhra Pradesh");
        }
      } finally {
        if (!hasCachedDashboard) setLocationLoading(false);
      }
    };

    loadInitialWeather();
    // The first-location request should run only once when the dashboard opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Current location is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setError("");

    try {
      const position = await getBestCurrentPosition();
      const { latitude, longitude, accuracy } = position.coords;

      if (accuracy > 50000) {
        setError("Your browser returned only an approximate location. Enable precise location in Windows/browser settings or search your city manually.");
        return;
      }

      await fetchWeatherByCoordinates(latitude, longitude, "location");
    } catch (geoError) {
      if (geoError?.code === geoError?.PERMISSION_DENIED || geoError?.code === 1) {
        setError("Location permission was denied. Allow precise location access in your browser and try again.");
      } else if (geoError?.code === geoError?.POSITION_UNAVAILABLE || geoError?.code === 2) {
        setError("Your current location could not be determined.");
      } else if (geoError?.code === geoError?.TIMEOUT || geoError?.code === 3) {
        setError("Location request timed out. Please try again.");
      } else {
        setError("Unable to access your current location.");
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchCitySuggestions = async (query) => {
    const cleaned = query.trim();
    if (cleaned.length < 2) return [];

    const searchOnce = async (term) => {
      const response = await fetch(
        `${GEO_API_URL}?name=${encodeURIComponent(term)}&count=10&language=en&format=json`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.results || [];
    };

    try {
      let places = await searchOnce(cleaned);

      // Fuzzy fallback for near-miss spellings such as "vijayawa" -> Vijayawada.
      if (places.length === 0 && cleaned.length >= 5) {
        for (let cut = 1; cut <= Math.min(3, cleaned.length - 4); cut += 1) {
          places = await searchOnce(cleaned.slice(0, -cut));
          if (places.length > 0) break;
        }
      }

      const seen = new Set();
      return places
        .map((place) => ({
          name: place.name || "",
          state: place.admin1 || "",
          country: place.country_code || place.country || "",
          lat: place.latitude,
          lon: place.longitude,
          label: [place.name, place.admin1, place.country_code || place.country].filter(Boolean).join(", "),
          detail: [place.admin1, place.country_code || place.country].filter(Boolean).join(", "),
        }))
        .filter((place) => {
          if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon) || !place.name) return false;
          const key = `${place.name}|${place.state}|${place.country}|${place.lat.toFixed(3)}|${place.lon.toFixed(3)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 5);
    } catch (suggestionError) {
      console.error("Error fetching city suggestions:", suggestionError);
      return [];
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setLocationDetails({ name: suggestion.name, state: suggestion.state, country: suggestion.country });
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
                <MainWeatherCard weatherData={weatherData} locationDetails={locationDetails} />
                {fiveDayForecast && <FiveDayForecast forecastData={fiveDayForecast} locationDetails={locationDetails} />}
              </div>

              {airQualityData && (
                <TodayHighlights
                  weatherData={weatherData}
                  airQualityData={airQualityData}
                  forecastData={fiveDayForecast}
                  style={desktopColumnHeight ? { height: desktopColumnHeight } : undefined}
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
