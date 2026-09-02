import { useState } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterDramaTwoToneIcon from "@mui/icons-material/FilterDramaTwoTone";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";

const Navbar = ({ onSearch, onCurrentLocation, locationLoading }) => {
  const [searchCity, setSearchCity] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedCity = searchCity.trim();
    if (!trimmedCity) return;

    onSearch(trimmedCity);
    setSearchCity("");
  };

  return (
    <header className="topbar">
      <div className="brand-wrap" aria-label="Weather dashboard">
        <span className="brand-icon" aria-hidden="true">
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

      <button
        className="location-chip location-button"
        type="button"
        onClick={onCurrentLocation}
        disabled={locationLoading}
        aria-label="Get weather for current location"
      >
        <GpsFixedRoundedIcon />
        <span>{locationLoading ? "Locating..." : "Current Location"}</span>
      </button>
    </header>
  );
};

export default Navbar;
