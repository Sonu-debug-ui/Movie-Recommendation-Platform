import { Link } from "react-router-dom";
import "../css/Favorites.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";

function Favorites() {
  const { favorites } = useMovieContext();

  if (favorites && favorites.length > 0) {
    return (
      <div className="favorites">
        <div className="favorites-header">
          <h2>Your Favorites</h2>
          <span className="favorites-count-tag">{favorites.length} {favorites.length === 1 ? "Movie" : "Movies"}</span>
        </div>
        <div className="movies-grid">
          {favorites.map((movie, index) => (
            <MovieCard movie={movie} key={movie.id || movie.imdbID || index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-empty-container">
      <div className="favorites-empty-card">
        <div className="empty-icon-wrapper">
          <span className="empty-icon">🍿</span>
        </div>
        <h2>Your Watchlist is Empty</h2>
        <p>
          Explore trending blockbusters, search your favorite classics, and save your top picks to build your personalized watchlist!
        </p>
        <Link to="/" className="btn-browse-trending">
          🍿 Browse Trending Movies
        </Link>
      </div>
    </div>
  );
}

export default Favorites;
