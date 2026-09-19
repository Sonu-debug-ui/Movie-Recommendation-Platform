import { useState } from "react";
import "../css/MovieCard.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieModal from "./MovieModal";
import { getSafePosterUrl, handlePosterError } from "../utils/posterHelper";

function MovieCard({ movie }) {
  const [showModal, setShowModal] = useState(false);
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const movieId = movie.id || movie.imdbID;
  const favorite = isFavorite(movieId);

  function onFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (favorite) removeFromFavorites(movieId);
    else addToFavorites(movie);
  }

  const rating = movie.imdbRating || movie.vote_average || "8.8";
  const primaryGenre = movie.genre ? movie.genre.split(",")[0].trim() : null;
  const year = movie.release_date?.split("-")[0] || movie.release_year || movie.year || "";

  return (
    <>
      <div className="movie-card" onClick={() => setShowModal(true)}>
        <div className="movie-poster">
          <div className="card-rating-badge">⭐ {rating}</div>
          {movie.isCustom && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "linear-gradient(135deg, #e50914 0%, #b20710 100%)",
                color: "#ffffff",
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "6px",
                letterSpacing: "0.5px",
                boxShadow: "0 2px 8px rgba(229,9,20,0.5)",
                zIndex: 2,
              }}
            >
              PREMIERE
            </div>
          )}
          {primaryGenre && (
            <div className="card-genre-badge">{primaryGenre}</div>
          )}
          <img
            src={getSafePosterUrl(movie, movie.title, year, primaryGenre)}
            alt={movie.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => handlePosterError(e, movie.title, year, primaryGenre, movieId)}
          />
          <div className="movie-overlay">
            <button
              className={`favorite-btn ${favorite ? "active" : ""}`}
              onClick={onFavoriteClick}
              title={favorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              ♥
            </button>
          </div>
        </div>
        <div className="movie-info">
          <h3>{movie.title}</h3>
          <p>{year}</p>
        </div>
      </div>

      {showModal && (
        <MovieModal movie={movie} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export default MovieCard;
