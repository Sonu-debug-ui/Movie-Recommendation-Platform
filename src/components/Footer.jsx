import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSiteSettings } from "../hooks/useSiteSettings";
import "../css/Footer.css";

function Footer() {
  const { isLoggedIn, isAdmin } = useAuth();
  const { siteName = "CineFlix" } = useSiteSettings();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-brand-title">
            <h3>🎬 {siteName}</h3>
            <span className="footer-version-tag">v2.4</span>
          </div>
          <p>
            Next-generation movie discovery platform powered by real-time API integrations, glassmorphic UI, and multi-region cinematic streaming catalog.
          </p>
          <div className="footer-tech-badges">
            <span className="tech-badge">⚡ React 19</span>
            <span className="tech-badge">🚀 Vite</span>
            <span className="tech-badge">🍿 OMDB API</span>
            <span className="tech-badge">✨ Glassmorphism UI</span>
            <span className="tech-badge">🐘 Supabase DB</span>
          </div>
        </div>

        <div className="footer-links">
          <h4>Navigation</h4>
          <ul>
            <li>
              <Link to="/">Home Feed</Link>
            </li>
            <li>
              <Link to="/favorites">Favorites Watchlist</Link>
            </li>
            <li>
              <Link to="/about">About CineFlix</Link>
            </li>
            {isLoggedIn && (
              <li>
                <Link to="/profile">User Profile</Link>
              </li>
            )}
            {isAdmin ? (
              <li>
                <Link to="/admin" className="footer-admin-link">
                  🔑 Admin Console
                </Link>
              </li>
            ) : (
              <li>
                <Link to="/admin/login" className="footer-staff-link">
                  Staff Login
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="footer-status">
          <h4>Platform Health</h4>
          <div className="status-pill">
            <span className="status-dot"></span>
            Realtime Services Online
          </div>
          <p>Multi-Region High Availability & Instant Sync.</p>
          <button className="btn-back-to-top" onClick={scrollToTop}>
            ↑ Back to Top
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {siteName} Recommendation Platform. All rights reserved.</p>
        <div className="footer-bottom-links">
          <span>Glassmorphic Cinema Experience</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
