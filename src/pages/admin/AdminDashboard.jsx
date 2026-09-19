import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import AdminLayout from "../../components/AdminLayout";
import "../../css/Admin.css";

function AdminDashboard() {
  const { siteName = "CineFlix" } = useSiteSettings();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMovies: 0,
    totalReviews: 0,
    totalRatings: 0,
    totalGenres: 0,
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          usersRes,
          moviesRes,
          reviewsRes,
          ratingsRes,
          genresRes,
          recentRevRes,
          recentMovRes,
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("movies").select("id", { count: "exact", head: true }),
          supabase.from("reviews").select("id", { count: "exact", head: true }),
          supabase.from("ratings").select("id", { count: "exact", head: true }),
          supabase.from("genres").select("id", { count: "exact", head: true }),
          supabase
            .from("reviews")
            .select("*, profiles(name)")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("movies")
            .select("id, title, genre, release_year, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalMovies: moviesRes.count || 0,
          totalReviews: reviewsRes.count || 0,
          totalRatings: ratingsRes.count || 0,
          totalGenres: genresRes.count || 0,
        });

        setRecentReviews(recentRevRes.data || []);
        setRecentMovies(recentMovRes.data || []);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      icon: "👥",
      label: "Total Users",
      value: stats.totalUsers,
      to: "/admin/users",
      badge: "Accounts",
    },
    {
      icon: "🎬",
      label: "Catalog Movies",
      value: stats.totalMovies,
      to: "/admin/movies",
      badge: "In Database",
    },
    {
      icon: "🏷️",
      label: "Movie Genres",
      value: stats.totalGenres,
      to: "/admin/genres",
      badge: "Categories",
    },
    {
      icon: "💬",
      label: "User Reviews",
      value: stats.totalReviews,
      to: "/admin/reviews",
      badge: "Feedback",
    },
    {
      icon: "⭐",
      label: "Star Ratings",
      value: stats.totalRatings,
      to: "/admin/analytics",
      badge: "Ratings",
    },
  ];

  return (
    <AdminLayout title="Dashboard Overview">
        <div
          className="admin-page-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1>📊 System Overview</h1>
            <p>Live summary of {siteName} database, catalog, and user metrics.</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              to="/"
              className="btn-admin-secondary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              🌐 View Public Website
            </Link>
            <Link
              to="/admin/movies"
              className="btn-admin-primary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              ➕ Add New Movie
            </Link>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="admin-stat-card"
              style={{ textDecoration: "none", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="admin-stat-icon">{card.icon}</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    color: "#94a3b8",
                  }}
                >
                  {card.badge}
                </span>
              </div>
              <span className="admin-stat-value">
                {loading ? "..." : card.value.toLocaleString()}
              </span>
              <span className="admin-stat-label">{card.label} →</span>
            </Link>
          ))}
        </div>

        {/* Two-Column Activity Feeds */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {/* Recent Catalog Movies */}
          <div className="admin-table-wrapper">
            <div className="admin-table-header">
              <h3>🎬 Recently Added Movies</h3>
              <Link
                to="/admin/movies"
                style={{ color: "#e50914", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 }}
              >
                Manage All →
              </Link>
            </div>
            {recentMovies.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Genre</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovies.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.title}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#ff6b6b" }}>
                          {m.genre || "—"}
                        </span>
                      </td>
                      <td>{m.release_year || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-empty-state">
                No custom movies added yet. Click "+ Add New Movie" to create your first title!
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="admin-table-wrapper">
            <div className="admin-table-header">
              <h3>💬 Recent User Reviews</h3>
              <Link
                to="/admin/reviews"
                style={{ color: "#e50914", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 }}
              >
                Moderate All →
              </Link>
            </div>
            {recentReviews.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reviewer</th>
                    <th>Content</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <strong>{review.profiles?.name || "Anonymous"}</strong>
                      </td>
                      <td>{review.content?.substring(0, 60)}...</td>
                      <td>{new Date(review.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-empty-state">
                No user reviews yet. Community reviews will show here.
              </div>
            )}
          </div>
        </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
