import { useState } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterDramaTwoToneIcon from "@mui/icons-material/FilterDramaTwoTone";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";

const Navbar = ({ onSearch, currentCity }) => {
  const [searchCity, setSearchCity] = useState("");

  const handleSearchClick = () => {
    const trimmedCity = searchCity.trim();
    if (trimmedCity) {
      onSearch(trimmedCity);
      setSearchCity("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSearchClick();
  };

  return (
    <header className="topbar">
      <div className="brand-wrap" aria-label="Weather dashboard">
        <span className="brand-icon">
          <FilterDramaTwoToneIcon />
        </span>
        <div className="brand-copy">
          <span className="brand-name">Weather</span>
          <span className="brand-subtitle">Forecast dashboard</span>
        </div>
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-box">
          <SearchRoundedIcon className="search-icon" />
          <input
            type="search"
            value={searchCity}
            onChange={(event) => setSearchCity(event.target.value)}
            placeholder="Search city, e.g. Hyderabad"
            aria-label="Search city"
          />
        </div>
        <button className="search-button" type="submit">
          Search
        </button>
      </form>

      <div className="location-chip" title={currentCity ? `Current weather: ${currentCity}` : "Current location"}>
        <GpsFixedRoundedIcon />
        <span>Current Location</span>
      </div>
    </header>
  );
};

export default Navbar;
