import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";

const getDailyForecasts = (list = []) => {
  const byDate = new Map();

  list.forEach((item) => {
    const dateKey = item.dt_txt?.split(" ")[0];
    if (!dateKey) return;

    const current = byDate.get(dateKey);
    const hour = Number(item.dt_txt.split(" ")[1]?.split(":")[0] || 0);
    const distanceFromNoon = Math.abs(hour - 12);

    if (!current || distanceFromNoon < current.distanceFromNoon) {
      byDate.set(dateKey, { item, distanceFromNoon });
    }
  });

  return Array.from(byDate.values()).slice(0, 5).map(({ item }) => item);
};

const FiveDayForecast = ({ forecastData, locationDetails }) => {
  const dailyForecasts = getDailyForecasts(forecastData?.list);

  const formatDay = (dateString, index) => {
    if (index === 0) return "Today";
    return new Date(dateString).toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    });

  return (
    <section className="forecast-section glass-card">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Next Days</span>
          <h2>5-Day Forecast</h2>
        </div>
        <span className="forecast-location">{[locationDetails?.name || forecastData?.city?.name, locationDetails?.state].filter(Boolean).join(", ")}</span>
      </div>

      <div className="forecast-list">
        {dailyForecasts.map((item, index) => {
          const iconCode = item.weather?.[0]?.icon;
          const rainChance = Math.round((item.pop || 0) * 100);
          return (
            <article className="forecast-row forecast-row-enhanced" key={item.dt}>
              <div className="forecast-day">
                <strong>{formatDay(item.dt_txt, index)}</strong>
                <span>{formatDate(item.dt_txt)}</span>
              </div>

              <div className="forecast-condition">
                {iconCode && (
                  <img
                    src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
                    alt={item.weather?.[0]?.description || "Weather"}
                  />
                )}
                <span>{item.weather?.[0]?.description}</span>
              </div>

              <div className="forecast-rain" title="Precipitation probability">
                <WaterDropRoundedIcon />
                <span>{rainChance}%</span>
              </div>

              <div className="forecast-temp-stack">
                <strong>{Math.round(item.main.temp_max)}°</strong>
                <span>{Math.round(item.main.temp_min)}°</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default FiveDayForecast;
