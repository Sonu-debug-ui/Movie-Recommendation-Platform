import React, { useState, useRef, useMemo } from "react";
import homeSuggestions from "../data/homeSuggestions.json";
import { getSafePosterUrl, handlePosterError } from "../utils/posterHelper";
import "../css/HomeSuggestionsRail.css";

const MOOD_TABS = [
  { id: "all", label: "🌟 Top Suggestions", icon: "✨" },
  { id: "mindbending", label: "🧠 Mind-Bending", icon: "🌀" },
  { id: "thriller", label: "🕵️ Crime & Thriller", icon: "🔥" },
  { id: "masterpiece", label: "👑 Masterpieces", icon: "🏆" },
  { id: "epic", label: "⚔️ Epic Cinema", icon: "🌌" },
  { id: "anime_world", label: "⛩️ Anime & World", icon: "🌸" },
  { id: "desi", label: "🇮🇳 Desi Hits", icon: "🎬" },
];

const MATCH_TAGS = [
  "99% Match",
  "Must Watch",
  "Critically Acclaimed",
  "Oscar Winner",
  "Staff Pick",
  "Masterpiece",
  "Trending Suggestion",
];

export default function HomeSuggestionsRail({ onSelectMovie }) {
  const [activeMood, setActiveMood] = useState("all");
  const [surpriseMovie, setSurpriseMovie] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const trackRef = useRef(null);

  // Filter movies based on selected mood
  const filteredSuggestions = useMemo(() => {
    switch (activeMood) {
      case "mindbending":
        return homeSuggestions.filter((m) =>
          ["tt0482571", "tt0209144", "tt1130884", "tt0088763", "tt0137523", "tt0443706"].includes(m.id)
        );
      case "thriller":
        return homeSuggestions.filter((m) =>
          ["tt0114369", "tt0102926", "tt2267998", "tt1392214", "tt0443706", "tt4430212"].includes(m.id)
        );
      case "masterpiece":
        return homeSuggestions.filter((m) =>
          ["tt0111161", "tt0068646", "tt0110912", "tt0050083", "tt0108052", "tt0099685", "tt2582802"].includes(m.id)
        );
      case "epic":
        return homeSuggestions.filter((m) =>
          ["tt0120737", "tt0167260", "tt0076759", "tt0080684", "tt0082971", "tt0079588"].includes(m.id)
        );
      case "anime_world":
        return homeSuggestions.filter((m) =>
          ["tt0119698", "tt0347149", "tt0095327", "tt9179430"].includes(m.id)
        );
      case "desi":
        return homeSuggestions.filter((m) =>
          ["tt9179430", "tt1954470", "tt1567102", "tt4430212", "tt15327088", "tt2338151", "tt2356180"].includes(m.id)
        );
      default:
        return homeSuggestions;
    }
  }, [activeMood]);

  // Scroll controls
  const handleScroll = (direction) => {
    if (!trackRef.current) return;
    const scrollAmount = direction === "left" ? -550 : 550;
    trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Surprise Me / Random Suggestion handler
  const handleSurpriseMe = () => {
    setIsRolling(true);
    let count = 0;
    const maxRolls = 6;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * homeSuggestions.length);
      setSurpriseMovie(homeSuggestions[randomIndex]);
      count++;
      if (count >= maxRolls) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 90);
  };

  return (
    <section className="home-suggestions-rail-wrapper">
      <div className="suggestions-rail-header">
        <div className="rail-title-group">
          <div className="rail-badge-row">
            <span className="suggestions-sparkle-badge">✨ AI CURATED FOR YOU</span>
            <span className="suggestions-count-badge">{filteredSuggestions.length} Suggestions</span>
          </div>
          <h2 className="rail-main-title">
            CineFlix <span className="highlight-text">Movie Suggestions</span> & Recommendations
          </h2>
          <p className="rail-subtitle">
            Handpicked cinema recommendations, highest-rated masterpieces & hidden gems ready to stream
          </p>
        </div>

        <div className="rail-actions-group">
          <button
            type="button"
            className={`surprise-me-btn ${isRolling ? "rolling" : ""}`}
            onClick={handleSurpriseMe}
            title="Get a random CineFlix movie suggestion"
          >
            <span className="dice-icon">{isRolling ? "🎲" : "🎲"}</span>
            <span className="btn-label">{isRolling ? "Shuffling Picks..." : "Surprise Me!"}</span>
          </button>

          <div className="rail-nav-arrows">
            <button
              type="button"
              className="rail-arrow-btn prev"
              onClick={() => handleScroll("left")}
              aria-label="Previous suggestions"
            >
              ‹
            </button>
            <button
              type="button"
              className="rail-arrow-btn next"
              onClick={() => handleScroll("right")}
              aria-label="Next suggestions"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Surprise Me Spotlight Card (when rolled) */}
      {surpriseMovie && (
        <div className="surprise-spotlight-card">
          <div className="surprise-badge">🎯 CineFlix Recommendation of the Moment</div>
          <div className="surprise-content">
            <img
              src={getSafePosterUrl(surpriseMovie, surpriseMovie.title, surpriseMovie.year, surpriseMovie.genre)}
              alt={surpriseMovie.title}
              className="surprise-poster"
              referrerPolicy="no-referrer"
              onError={(e) =>
                handlePosterError(
                  e,
                  surpriseMovie.title,
                  surpriseMovie.year,
                  surpriseMovie.genre,
                  surpriseMovie.id
                )
              }
            />
            <div className="surprise-info">
              <div className="surprise-meta">
                <span className="surprise-rating">⭐ {surpriseMovie.rating} / 10</span>
                <span className="surprise-year">{surpriseMovie.year}</span>
                <span className="surprise-genre">{surpriseMovie.genre}</span>
              </div>
              <h3 className="surprise-title">{surpriseMovie.title}</h3>
              <p className="surprise-plot">{surpriseMovie.plot || surpriseMovie.description}</p>
              <div className="surprise-btn-row">
                <button
                  type="button"
                  className="surprise-view-btn"
                  onClick={() => onSelectMovie && onSelectMovie(surpriseMovie)}
                >
                  🍿 Watch Trailer & Explore Movie
                </button>
                <button
                  type="button"
                  className="surprise-close-btn"
                  onClick={() => setSurpriseMovie(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood filter tabs */}
      <div className="mood-tabs-bar">
        {MOOD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`mood-tab-btn ${activeMood === tab.id ? "active" : ""}`}
            onClick={() => setActiveMood(tab.id)}
          >
            <span className="mood-tab-icon">{tab.icon}</span>
            <span className="mood-tab-text">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Horizontal Carousel Track */}
      <div className="suggestions-scroll-track" ref={trackRef}>
        {filteredSuggestions.map((movie, idx) => {
          const matchTag = MATCH_TAGS[idx % MATCH_TAGS.length];
          return (
            <div
              key={movie.id}
              className="suggestion-movie-card"
              onClick={() => onSelectMovie && onSelectMovie(movie)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectMovie && onSelectMovie(movie)}
            >
              <div className="card-poster-container">
                <img
                  src={getSafePosterUrl(movie, movie.title, movie.year, movie.genre)}
                  alt={movie.title}
                  className="card-poster-img"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) =>
                    handlePosterError(
                      e,
                      movie.title,
                      movie.year,
                      movie.genre,
                      movie.id
                    )
                  }
                />
                <div className="card-overlay-gradient">
                  <span className="card-match-badge">{matchTag}</span>
                  <span className="card-rating-badge">⭐ {movie.rating}</span>
                </div>
                <div className="card-hover-action">
                  <span className="hover-play-btn">▶ Quick View</span>
                </div>
              </div>

              <div className="card-content-area">
                <h4 className="card-movie-title" title={movie.title}>
                  {movie.title}
                </h4>
                <div className="card-metadata-row">
                  <span className="card-movie-year">{movie.year}</span>
                  {movie.genre && (
                    <span className="card-genre-tag" title={movie.genre}>
                      {movie.genre.split(",")[0].trim()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
