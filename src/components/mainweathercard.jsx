import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

const MainWeatherCard = ({ weatherData }) => {
  const temperatureCelsius = weatherData?.main?.temp;
  const weatherDescription = weatherData?.weather?.[0]?.description || "Weather unavailable";
  const cityName = weatherData?.name || "City unavailable";
  const countryName = weatherData?.sys?.country || "";
  const timestamp = weatherData?.dt;
  const iconCode = weatherData?.weather?.[0]?.icon;

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
        <span className="section-kicker">Current weather</span>
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
          <span>{cityName}{countryName ? `, ${countryName}` : ""}</span>
        </div>
      </div>

      <div className="hero-mini-stats">
        <div>
          <span>High</span>
          <strong>{Math.round(weatherData.main.temp_max)}°</strong>
        </div>
        <div>
          <span>Low</span>
          <strong>{Math.round(weatherData.main.temp_min)}°</strong>
        </div>
        <div>
          <span>Wind</span>
          <strong>{Math.round(weatherData.wind.speed * 3.6)} km/h</strong>
        </div>
      </div>
    </article>
  );
};

export default MainWeatherCard;
