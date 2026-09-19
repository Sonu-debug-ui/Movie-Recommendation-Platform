import { useState, useEffect } from "react";
import { getMovieDetails } from "../services/api";
import { useMovieContext } from "../contexts/MovieContext";
import DottedOffsetButton from "./DottedOffsetButton";
import { getSafePosterUrl } from "../utils/posterHelper";
import "../css/HeroSpotlight.css";

function HeroSpotlight({ movies = [], onOpenModal }) {
  const featuredMovies = movies.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [movieDetailsMap, setMovieDetailsMap] = useState({});
  const [isPaused, setIsPaused] = useState(false);

  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();

  const currentMovie = featuredMovies[currentIndex] || null;
  const currentMovieId = currentMovie ? (currentMovie.id || currentMovie.imdbID) : null;
  const favorite = isFavorite(currentMovieId);

  // Fetch extended details for the top featured movies in advance
  useEffect(() => {
    let isMounted = true;
    if (featuredMovies.length === 0) return;

    featuredMovies.forEach(async (m) => {
      const id = m.id || m.imdbID;
      if (id && !movieDetailsMap[id]) {
        try {
          const data = await getMovieDetails(id);
          if (isMounted && data) {
            setMovieDetailsMap((prev) => ({ ...prev, [id]: data }));
          }
        } catch (err) {
          console.error("Hero details error for ID", id, err);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [featuredMovies]);

  // Autoplay interval timer (5 seconds delay)
  useEffect(() => {
    if (featuredMovies.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featuredMovies.length, isPaused]);

  if (!currentMovie) return null;

  const movieData = (currentMovieId && movieDetailsMap[currentMovieId]) || currentMovie;

  const getBackdropStyle = () => {
    const imgUrl = getSafePosterUrl(
      movieData,
      movieData.title,
      movieData.release_date || movieData.release_year,
      movieData.genre
    );
    return { backgroundImage: `url("${imgUrl}")` };
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (favorite) removeFromFavorites(currentMovieId);
    else addToFavorites(movieData);
  };

  return (
    <div
      className="hero-spotlight carousel-spotlight"
      style={getBackdropStyle()}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-vignette"></div>

      {/* Navigation Arrows */}
      {featuredMovies.length > 1 && (
        <div className="carousel-nav-controls">
          <button className="carousel-btn prev" onClick={handlePrev} title="Previous Movie">
            ❮
          </button>
          <button className="carousel-btn next" onClick={handleNext} title="Next Movie">
            ❯
          </button>
        </div>
      )}

      {/* Featured Content */}
      <div className="hero-content" key={currentMovieId || currentIndex}>
        <div className="hero-badge-row">
          <span className="hero-tag">
            🔥 Featured Spotlight ({currentIndex + 1}/{featuredMovies.length})
          </span>
        </div>

        <h1 className="hero-title">{movieData.title}</h1>

        <div className="hero-meta">
          {movieData.imdbRating && movieData.imdbRating !== "N/A" && (
            <span className="hero-rating">⭐ IMDb {movieData.imdbRating}</span>
          )}
          {movieData.release_date && <span>{movieData.release_date}</span>}
          {movieData.rated && movieData.rated !== "N/A" && (
            <span>• {movieData.rated}</span>
          )}
          {movieData.runtime && movieData.runtime !== "N/A" && (
            <span>• {movieData.runtime}</span>
          )}
          {movieData.genre && <span>• {movieData.genre}</span>}
        </div>

        <p className="hero-overview">
          {movieData.plot || "An epic cinematic journey awaits. Click Watch Trailer for full details."}
        </p>

        <div className="hero-actions">
          <DottedOffsetButton
            label="Watch Trailer & Details"
            padding="12px 24px"
            rounded={35}
            fill="#e50914"
            colors={{
              fill: "#e50914",
              hoverFill: "#b80710",
              textColor: "#FFFFFF",
              hoverTextColor: "#FFFFFF",
            }}
            addIcon={true}
            icon={{
              side: "left",
              size: 16,
              symbol: "▶",
              color: "#FFFFFF",
              hoverColor: "#FFFFFF",
            }}
            border={{
              borderColor: "rgba(255, 255, 255, 0.4)",
              borderStyle: "dashed",
              borderWidth: 2,
            }}
            hover={{
              offsetX: 6,
              offsetY: 6,
              rounded: 20,
              borderColor: "#FFFFFF",
            }}
            shadow={{
              color: "#ff2e3b",
            }}
            font={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onClick={() => onOpenModal(movieData)}
          />

          <DottedOffsetButton
            label={favorite ? "Saved in Favorites" : "Add to Favorites"}
            padding="12px 22px"
            rounded={35}
            fill={favorite ? "rgba(229, 9, 20, 0.2)" : "rgba(255, 255, 255, 0.08)"}
            colors={{
              fill: favorite ? "rgba(229, 9, 20, 0.2)" : "rgba(255, 255, 255, 0.08)",
              hoverFill: "rgba(255, 255, 255, 0.16)",
              textColor: favorite ? "#fca5a5" : "#FFFFFF",
              hoverTextColor: "#FFFFFF",
            }}
            addIcon={true}
            icon={{
              side: "left",
              size: 16,
              symbol: "♥",
              color: favorite ? "#ef4444" : "#ff4d6d",
              hoverColor: "#ffffff",
            }}
            border={{
              borderColor: favorite ? "rgba(239, 68, 68, 0.6)" : "rgba(255, 255, 255, 0.25)",
              borderStyle: "dotted",
              borderWidth: 2,
            }}
            hover={{
              offsetX: 6,
              offsetY: 6,
              rounded: 20,
              borderColor: favorite ? "#ef4444" : "#ffffff",
            }}
            shadow={{
              color: favorite ? "#ef4444" : "#3b82f6",
            }}
            font={{
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onClick={handleFavoriteToggle}
          />
        </div>
      </div>

      {/* Slide Indicators / Pagination Dots */}
      {featuredMovies.length > 1 && (
        <div className="carousel-indicators">
          {featuredMovies.map((_, idx) => (
            <button
              key={idx}
              className={`indicator-dot ${idx === currentIndex ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroSpotlight;
