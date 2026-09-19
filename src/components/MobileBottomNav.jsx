import { Link, useLocation } from "react-router-dom";
import { useMovieContext } from "../contexts/MovieContext";
import { useAuth } from "../contexts/AuthContext";
import "../css/MobileBottomNav.css";

function MobileBottomNav() {
  const { favorites } = useMovieContext();
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();
  const favCount = favorites ? favorites.length : 0;

  const scrollToSearch = () => {
    if (location.pathname !== "/") {
      window.location.href = "/";
    } else {
      window.scrollTo({ top: 350, behavior: "smooth" });
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      <Link
        to="/"
        className={`mobile-nav-item ${location.pathname === "/" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">🏠</span>
        <span>Home</span>
      </Link>

      <div className="mobile-nav-item" onClick={scrollToSearch}>
        <span className="mobile-nav-icon">🔍</span>
        <span>Search</span>
      </div>

      <Link
        to="/favorites"
        className={`mobile-nav-item ${location.pathname === "/favorites" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">💖</span>
        <span>Favorites</span>
        {favCount > 0 && <span className="mobile-badge">{favCount}</span>}
      </Link>

      {isLoggedIn && (
        <Link
          to="/profile"
          className={`mobile-nav-item ${location.pathname === "/profile" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">👤</span>
          <span>Profile</span>
        </Link>
      )}

      {isAdmin && (
        <Link
          to="/admin"
          className={`mobile-nav-item admin-mobile-tab ${location.pathname.startsWith("/admin") ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">🔑</span>
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
}

export default MobileBottomNav;
