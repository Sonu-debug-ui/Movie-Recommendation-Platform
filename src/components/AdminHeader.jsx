import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSiteSettings } from "../hooks/useSiteSettings";
import "../css/AdminHeader.css";

function AdminHeader({ title = "Dashboard" }) {
  const { profile } = useAuth();
  const { siteName = "CineFlix" } = useSiteSettings();

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <div className="admin-header-title-group">
          <span className="admin-header-breadcrumb">{siteName} Console</span>
          <span className="admin-breadcrumb-sep">/</span>
          <h1 className="admin-header-title">{title}</h1>
        </div>
      </div>

      <div className="admin-header-right">
        <div className="admin-db-status">
          <span className="admin-status-dot"></span>
          <span className="admin-status-text">Supabase Realtime</span>
        </div>

        <Link to="/" className="btn-admin-live-site">
          <span>🌐</span> View Live Site
        </Link>

        <div className="admin-header-user">
          <div className="admin-header-avatar">
            {profile?.name ? profile.name[0].toUpperCase() : "A"}
          </div>
          <div className="admin-header-user-info">
            <span className="admin-user-name">{profile?.name || "Admin"}</span>
            <span className="admin-user-role">SuperAdmin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
