import { useEffect, useRef, useState } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterDramaTwoToneIcon from "@mui/icons-material/FilterDramaTwoTone";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";

const Navbar = ({
  onSearch,
  onCurrentLocation,
  onGetSuggestions,
  onSelectSuggestion,
  locationLoading,
}) => {
  const [searchCity, setSearchCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const query = searchCity.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionLoading(false);
      setActiveIndex(-1);
      return undefined;
    }

    const currentRequestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const results = await onGetSuggestions(query);
        if (currentRequestId !== requestIdRef.current) return;
        setSuggestions(results);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setSuggestionLoading(false);
        }
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [searchCity, onGetSuggestions]);

  const chooseSuggestion = (suggestion) => {
    setSearchCity("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    onSelectSuggestion(suggestion);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
      chooseSuggestion(suggestions[activeIndex]);
      return;
    }

    const trimmedCity = searchCity.trim();
    if (!trimmedCity) return;

    onSearch(trimmedCity);
    setSearchCity("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === "Escape") setShowSuggestions(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
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
        <div className="search-input-wrap">
          <div className="search-box">
            <SearchRoundedIcon className="search-icon" />
            <input
              type="search"
              value={searchCity}
              onChange={(event) => setSearchCity(event.target.value)}
              onFocus={() => {
                if (searchCity.trim().length >= 2) setShowSuggestions(true);
              }}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 140)}
              onKeyDown={handleKeyDown}
              placeholder="Search city, e.g. Hyderabad"
              aria-label="Search city"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="city-suggestions"
              autoComplete="off"
            />
          </div>

          {showSuggestions && searchCity.trim().length >= 2 && (
            <div className="city-suggestions" id="city-suggestions" role="listbox">
              {suggestionLoading ? (
                <div className="suggestion-state">Searching cities...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.lat}-${suggestion.lon}-${suggestion.name}`}
                    type="button"
                    className={`city-suggestion ${activeIndex === index ? "is-active" : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    aria-selected={activeIndex === index}
                  >
                    <span className="suggestion-icon" aria-hidden="true">
                      <LocationOnRoundedIcon />
                    </span>
                    <span className="suggestion-copy">
                      <strong>{suggestion.label}</strong>
                      {suggestion.detail && <small>{suggestion.detail}</small>}
                    </span>
                  </button>
                ))
              ) : (
                <div className="suggestion-state">No matching cities found</div>
              )}
            </div>
          )}
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
