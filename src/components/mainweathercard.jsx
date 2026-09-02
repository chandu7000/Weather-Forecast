import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

const getWindDirection = (degrees = 0) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
};

const MainWeatherCard = ({ weatherData, locationDetails }) => {
  const temperatureCelsius = weatherData?.main?.temp;
  const weatherDescription = weatherData?.weather?.[0]?.description || "Weather unavailable";
  const cityName = locationDetails?.name || weatherData?.name || "City unavailable";
  const stateName = locationDetails?.state || "";
  const countryName = locationDetails?.country || weatherData?.sys?.country || "";
  const timestamp = weatherData?.dt;
  const iconCode = weatherData?.weather?.[0]?.icon;
  const windDirection = getWindDirection(weatherData?.wind?.deg);
  const windSpeed = Math.round((weatherData?.wind?.speed || 0) * 3.6);

  const currentDate = timestamp
    ? new Date(timestamp * 1000).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Date unavailable";

  const iconUrl = iconCode
    ? `https://openweathermap.org/img/wn/${iconCode}@4x.png`
    : null;

  return (
    <article className="weather-hero glass-card">
      <div className="hero-topline">
        <span className="section-kicker">Current Weather</span>
        <span className="live-pill"><i /> Live</span>
      </div>

      <div className="hero-weather-row">
        <div>
          <div className="temperature-line">
            <span className="temperature-value">{Math.round(temperatureCelsius)}°</span>
            <span className="temperature-unit">C</span>
          </div>
          <p className="weather-description">{weatherDescription}</p>
        </div>

        <div className="weather-icon-wrap" aria-hidden="true">
          {iconUrl && <img src={iconUrl} alt="" className="weather-icon-img" />}
        </div>
      </div>

      <div className="hero-divider" />

      <div className="hero-location">
        <div className="meta-row">
          <CalendarMonthRoundedIcon />
          <span>{currentDate}</span>
        </div>
        <div className="meta-row location-row">
          <LocationOnRoundedIcon />
          <span>{[cityName, stateName, countryName].filter(Boolean).join(", ")}</span>
        </div>
      </div>

      <div className="hero-mini-stats">
        <div>
          <span>High</span>
          <strong>{Math.round(weatherData.main.temp_max)}°C</strong>
        </div>
        <div>
          <span>Low</span>
          <strong>{Math.round(weatherData.main.temp_min)}°C</strong>
        </div>
        <div>
          <span>Wind</span>
          <strong>{windDirection} · {windSpeed} km/h</strong>
        </div>
      </div>
    </article>
  );
};

export default MainWeatherCard;
