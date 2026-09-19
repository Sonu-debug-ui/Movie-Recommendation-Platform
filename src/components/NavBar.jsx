import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMovieContext } from "../contexts/MovieContext";
import { useAuth } from "../contexts/AuthContext";
import { useSiteSettings } from "../hooks/useSiteSettings";
import AuthModal from "./AuthModal";
import WavePathMarquee from "./WavePathMarquee";
import DottedOffsetButton from "./DottedOffsetButton";
import "../css/NavBar.css";

function NavBar() {
  const { favorites } = useMovieContext();
  const { isLoggedIn, profile, isAdmin } = useAuth();
  const { siteName = "CineFlix" } = useSiteSettings();
  const location = useLocation();
  const favCount = favorites ? favorites.length : 0;
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="navbar-wrapper">
        <nav className="navbar">
          <div className="navbar-brand">
            <Link to="/" className="navbar-brand-link">
              <span className="brand-icon">🎬</span>
              <div className="navbar-marquee-wrapper" title={siteName}>
                <WavePathMarquee
                  text={siteName.toUpperCase()}
                  separator="✦"
                  gap={3}
                  speed={4}
                  reversed={false}
                  waveFrequency={1.8}
                  waveHeight={6}
                  textColor="gradient"
                  interactive={true}
                  font={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                  width="150px"
                  height="36px"
                  minHeight="36px"
                  background="transparent"
                />
              </div>
            </Link>
          </div>

          <div className="navbar-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/favorites"
              className={`nav-link ${location.pathname === "/favorites" ? "active" : ""}`}
            >
              Favorites
              {favCount > 0 && <span className="favorites-badge">{favCount}</span>}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`nav-link admin-nav-pill ${location.pathname.startsWith("/admin") ? "active" : ""}`}
              >
                🔑 Admin
              </Link>
            )}
          </div>

          <div className="navbar-auth">
            {isAdmin && (
              <Link
                to="/admin"
                className="navbar-mobile-admin-badge"
                title="Go to Admin Panel"
              >
                <span>🔑</span>
              </Link>
            )}

            {isLoggedIn ? (
              <Link to="/profile" className="navbar-user-btn">
                <div className="navbar-avatar">
                  {profile?.name ? profile.name[0].toUpperCase() : "U"}
                </div>
                <span className="navbar-username">{profile?.name || "Profile"}</span>
              </Link>
            ) : (
              <DottedOffsetButton
                label="Sign In"
                padding="8px 20px"
                rounded={35}
                fill="#e50914"
                colors={{
                  fill: "#e50914",
                  hoverFill: "#b80710",
                  textColor: "#FFFFFF",
                  hoverTextColor: "#FFFFFF",
                }}
                font={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                border={{
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  borderStyle: "dashed",
                  borderWidth: 1.5,
                }}
                hover={{
                  offsetX: 4,
                  offsetY: 4,
                  rounded: 20,
                  borderColor: "#FFFFFF",
                }}
                shadow={{
                  color: "#ff2e3b",
                }}
                onClick={() => setShowAuthModal(true)}
              />
            )}
          </div>
        </nav>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}

export default NavBar;