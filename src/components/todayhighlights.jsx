import AirRoundedIcon from "@mui/icons-material/AirRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import NightsStayRoundedIcon from "@mui/icons-material/NightsStayRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CompressRoundedIcon from "@mui/icons-material/CompressRounded";
import DeviceThermostatRoundedIcon from "@mui/icons-material/DeviceThermostatRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import HighlightBox from "./Highlightbox";

const TodayHighlights = ({ weatherData, airQualityData }) => {
  const { main, wind, visibility, sys } = weatherData;
  const airQualityIndex = airQualityData?.main?.aqi;
  const { co, no, no2, o3 } = airQualityData?.components || {};

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
  ];

  return (
    <section className="highlights-panel glass-card">
      <div className="section-heading-row highlights-heading">
        <div>
          <span className="section-kicker">Conditions</span>
          <h2>Today's Highlights</h2>
        </div>
        <div className="wind-chip">
          <ExploreRoundedIcon />
          <span>{Math.round(wind.speed * 3.6)} km/h</span>
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

          <div className="air-content">
            <span className="feature-icon big-icon"><AirRoundedIcon /></span>
            <div className="air-values">
              <div><span>CO</span><strong>{Math.round(co || 0)}</strong><small>µg/m³</small></div>
              <div><span>NO</span><strong>{Math.round(no || 0)}</strong><small>µg/m³</small></div>
              <div><span>NO₂</span><strong>{Math.round(no2 || 0)}</strong><small>µg/m³</small></div>
              <div><span>O₃</span><strong>{Math.round(o3 || 0)}</strong><small>µg/m³</small></div>
            </div>
          </div>
        </article>

        <article className="feature-card sun-card">
          <div className="feature-card-title">
            <div>
              <span className="card-label">Sun cycle</span>
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

      <div className="highlight-grid">
        {highlights.map((highlight) => (
          <HighlightBox key={highlight.title} {...highlight} />
        ))}
      </div>
    </section>
  );
};

export default TodayHighlights;
