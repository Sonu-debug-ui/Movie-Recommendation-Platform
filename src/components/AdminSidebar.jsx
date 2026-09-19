import { NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSiteSettings } from "../hooks/useSiteSettings";
import WavePathMarquee from "./WavePathMarquee";
import "../css/Admin.css";
import "../css/AdminHeader.css";

function AdminSidebar() {
  const { signOut, profile } = useAuth();
  const { siteName = "CineFlix" } = useSiteSettings();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const navLinks = [
    { to: "/admin", label: "Dashboard", icon: "📊", end: true },
    { to: "/admin/movies", label: "Manage Movies", icon: "🎬" },
    { to: "/admin/genres", label: "Manage Genres", icon: "🏷️" },
    { to: "/admin/users", label: "Manage Users", icon: "👥" },
    { to: "/admin/reviews", label: "Reviews & Ratings", icon: "⭐" },
    { to: "/admin/analytics", label: "Analytics", icon: "📈" },
    { to: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <Link to="/admin" className="admin-logo-link">
          <div className="admin-logo-brand">
            <span className="admin-brand-icon">🎬</span>
            <div className="admin-marquee-wrapper" title={`${siteName} Admin`}>
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
                width="140px"
                height="34px"
                minHeight="34px"
                background="transparent"
              />
            </div>
          </div>
          <span className="admin-badge">Admin Panel</span>
        </Link>
      </div>

      <div className="admin-sidebar-quicklink">
        <Link to="/" className="btn-sidebar-live-site">
          <span>🌐</span> Back to {siteName}
        </Link>
      </div>

      <nav className="admin-nav">
        <div className="admin-nav-section">Main</div>
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="admin-nav-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "10px" }}>
          Logged in as <strong style={{ color: "#94a3b8" }}>{profile?.name || profile?.email}</strong>
        </div>
        <button className="btn-admin-signout" onClick={handleSignOut}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
