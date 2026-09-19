import { useSiteSettings } from "../hooks/useSiteSettings";
import "../css/AdminHeader.css";

function AdminFooter() {
  const { siteName = "CineFlix" } = useSiteSettings();

  return (
    <footer className="admin-footer">
      <div className="admin-footer-left">
        <span>© {new Date().getFullYear()} {siteName} Admin Console</span>
        <span className="admin-footer-sep">•</span>
        <span>Supabase PostgreSQL Realtime Platform</span>
      </div>
      <div className="admin-footer-right">
        <span className="admin-system-badge">🟢 All Systems Operational</span>
        <span className="admin-version">v2.4.0</span>
      </div>
    </footer>
  );
}

export default AdminFooter;
