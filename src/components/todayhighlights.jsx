import AirRoundedIcon from "@mui/icons-material/AirRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import NightsStayRoundedIcon from "@mui/icons-material/NightsStayRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CompressRoundedIcon from "@mui/icons-material/CompressRounded";
import DeviceThermostatRoundedIcon from "@mui/icons-material/DeviceThermostatRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import NavigationRoundedIcon from "@mui/icons-material/NavigationRounded";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import HighlightBox from "./Highlightbox";

const getWindDirection = (degrees = 0) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
};

const TodayHighlights = ({ weatherData, airQualityData, forecastData }) => {
  const { main, wind, visibility, sys, clouds } = weatherData;
  const airQualityIndex = airQualityData?.main?.aqi;
  const { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = airQualityData?.components || {};
  const precipitationChance = Math.round((forecastData?.list?.[0]?.pop || 0) * 100);
  const windSpeed = Math.round((wind?.speed || 0) * 3.6);
  const windDirection = getWindDirection(wind?.deg);
  const windGust = wind?.gust ? Math.round(wind.gust * 3.6) : null;
  const seaLevelPressure = main?.sea_level ?? forecastData?.list?.[0]?.main?.sea_level ?? main.pressure;
  const daylightSeconds = Math.max(0, (sys?.sunset || 0) - (sys?.sunrise || 0));
  const daylightHours = Math.floor(daylightSeconds / 3600);
  const daylightMinutes = Math.floor((daylightSeconds % 3600) / 60);

  const airQuality = {
    1: { label: "Good", className: "aqi-good" },
    2: { label: "Fair", className: "aqi-fair" },
    3: { label: "Moderate", className: "aqi-moderate" },
    4: { label: "Poor", className: "aqi-poor" },
    5: { label: "Very Poor", className: "aqi-very-poor" },
  }[airQualityIndex] || { label: "Unknown", className: "aqi-unknown" };

  const formatTime = (unixTime) =>
    new Date(unixTime * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatUpdatedTime = (unixTime) =>
    new Date(unixTime * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const pollutants = [
    ["CO", co],
    ["NO", no],
    ["NO₂", no2],
    ["O₃", o3],
    ["SO₂", so2],
    ["PM2.5", pm2_5],
    ["PM10", pm10],
    ["NH₃", nh3],
  ];

  const highlights = [
    {
      title: "Humidity",
      value: `${main.humidity}%`,
      subtitle: "Relative humidity",
      Icon: WaterDropRoundedIcon,
    },
    {
      title: "Pressure",
      value: `${main.pressure} hPa`,
      subtitle: "Atmospheric pressure",
      Icon: CompressRoundedIcon,
    },
    {
      title: "Visibility",
      value: `${(visibility / 1000).toFixed(1)} km`,
      subtitle: "Viewing distance",
      Icon: VisibilityRoundedIcon,
    },
    {
      title: "Feels Like",
      value: `${Math.round(main.feels_like)}°C`,
      subtitle: "Perceived temperature",
      Icon: DeviceThermostatRoundedIcon,
    },
    {
      title: "Wind Speed",
      value: `${windSpeed} km/h`,
      subtitle: wind?.gust ? `Gusts ${Math.round(wind.gust * 3.6)} km/h` : "Current wind speed",
      Icon: AirRoundedIcon,
    },
    {
      title: "Wind Direction",
      value: `${windDirection} ${Math.round(wind?.deg || 0)}°`,
      subtitle: "Direction of travel",
      Icon: NavigationRoundedIcon,
    },
    {
      title: "Cloud Cover",
      value: `${clouds?.all ?? 0}%`,
      subtitle: "Sky coverage",
      Icon: CloudRoundedIcon,
    },
    {
      title: "Rain Chance",
      value: `${precipitationChance}%`,
      subtitle: "Next forecast period",
      Icon: GrainRoundedIcon,
    },
    {
      title: "Wind Gust",
      value: windGust ? `${windGust} km/h` : "—",
      subtitle: windGust ? "Peak wind speed" : "No gust reported",
      Icon: AirRoundedIcon,
    },
    {
      title: "Sea Level Pressure",
      value: `${seaLevelPressure} hPa`,
      subtitle: "Pressure at sea level",
      Icon: SpeedRoundedIcon,
    },
    {
      title: "Day Length",
      value: `${daylightHours}h ${daylightMinutes}m`,
      subtitle: "Sunrise to sunset",
      Icon: WbSunnyRoundedIcon,
    },
    {
      title: "Last Updated",
      value: formatUpdatedTime(weatherData.dt),
      subtitle: "Latest observation",
      Icon: ScheduleRoundedIcon,
    },
  ];

  return (
    <section className="highlights-panel glass-card">
      <div className="section-heading-row highlights-heading">
        <div>
          <span className="section-kicker">Conditions</span>
          <h2>Today's Highlights</h2>
        </div>
        <div className="wind-chip" title="Current wind">
          <ExploreRoundedIcon />
          <span>{windDirection} · {windSpeed} km/h</span>
        </div>
      </div>

      <div className="featured-highlights">
        <article className="feature-card air-quality-card">
          <div className="feature-card-title">
            <div>
              <span className="card-label">Air Quality Index</span>
              <strong>Outdoor air</strong>
            </div>
            <span className={`aqi-badge ${airQuality.className}`}>{airQuality.label}</span>
          </div>

          <div className="air-content air-content-expanded">
            <span className="feature-icon big-icon"><AirRoundedIcon /></span>
            <div className="air-values air-values-expanded">
              {pollutants.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{Math.round(value || 0)}</strong>
                  <small>µg/m³</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="feature-card sun-card">
          <div className="feature-card-title">
            <div>
              <span className="card-label">Sun Cycle</span>
              <strong>Sunrise & Sunset</strong>
            </div>
          </div>

          <div className="sun-times">
            <div className="sun-time-item">
              <span className="feature-icon sunrise-icon"><WbSunnyRoundedIcon /></span>
              <div>
                <span>Sunrise</span>
                <strong>{formatTime(sys.sunrise)}</strong>
              </div>
            </div>
            <div className="sun-divider" />
            <div className="sun-time-item">
              <span className="feature-icon sunset-icon"><NightsStayRoundedIcon /></span>
              <div>
                <span>Sunset</span>
                <strong>{formatTime(sys.sunset)}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="highlight-grid highlight-grid-expanded">
        {highlights.map((highlight) => (
          <HighlightBox key={highlight.title} {...highlight} />
        ))}
      </div>
    </section>
  );
};

export default TodayHighlights;
