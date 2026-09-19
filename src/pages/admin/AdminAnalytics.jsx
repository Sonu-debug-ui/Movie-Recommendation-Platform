import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";
import "../../css/Admin.css";
import "../../css/AdminAnalytics.css";

function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMovies: 0,
    totalReviews: 0,
    totalRatings: 0,
    avgRating: 0,
    blockedUsers: 0,
    flaggedReviews: 0,
    adminUsers: 0,
  });
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [
          usersRes, moviesRes, reviewsRes, ratingsRes,
          blockedRes, flaggedRes, adminRes, recentUsersRes, ratingsForAvgRes
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("movies").select("id", { count: "exact", head: true }),
          supabase.from("reviews").select("id", { count: "exact", head: true }),
          supabase.from("ratings").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_blocked", true),
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_flagged", true),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
          supabase.from("profiles").select("name, email, created_at, role").order("created_at", { ascending: false }).limit(5),
          supabase.from("ratings").select("stars"),
        ]);

        // Average rating calculation
        const ratingsData = ratingsForAvgRes.data || [];
        const avg = ratingsData.length
          ? (ratingsData.reduce((sum, r) => sum + (r.stars || 0), 0) / ratingsData.length).toFixed(1)
          : 0;

        setStats({
          totalUsers: usersRes.count || 0,
          totalMovies: moviesRes.count || 0,
          totalReviews: reviewsRes.count || 0,
          totalRatings: ratingsRes.count || 0,
          avgRating: avg,
          blockedUsers: blockedRes.count || 0,
          flaggedReviews: flaggedRes.count || 0,
          adminUsers: adminRes.count || 0,
        });
        setRecentUsers(recentUsersRes.data || []);
      } catch (err) {
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statCards = [
    { icon: "👥", label: "Total Users", value: stats.totalUsers, color: "#60a5fa" },
    { icon: "🎬", label: "Total Movies", value: stats.totalMovies, color: "#f472b6" },
    { icon: "💬", label: "Total Reviews", value: stats.totalReviews, color: "#34d399" },
    { icon: "⭐", label: "Total Ratings", value: stats.totalRatings, color: "#fbbf24" },
    { icon: "📊", label: "Avg Rating", value: `${stats.avgRating} / 5`, color: "#a78bfa" },
    { icon: "🚫", label: "Blocked Users", value: stats.blockedUsers, color: "#f87171" },
    { icon: "⚑", label: "Flagged Reviews", value: stats.flaggedReviews, color: "#fb923c" },
    { icon: "🔑", label: "Admin Accounts", value: stats.adminUsers, color: "#f5c518" },
  ];

  return (
    <AdminLayout title="Analytics & Reports">
        <div className="admin-page-header">
          <h1>📈 Analytics & Reports</h1>
          <p>Platform usage metrics, user growth, and content performance.</p>
        </div>

        {loading ? (
          <div className="admin-empty-state">Loading analytics...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="analytics-stats-grid">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="analytics-stat-card"
                  style={{ "--accent": card.color }}
                >
                  <div className="analytics-stat-icon">{card.icon}</div>
                  <div className="analytics-stat-value" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="analytics-stat-label">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Platform Health */}
            <div className="analytics-section-grid">
              <div className="admin-table-wrapper">
                <div className="admin-table-header">
                  <h3>🏥 Platform Health</h3>
                </div>
                <div style={{ padding: "1.2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    {
                      label: "Content Coverage",
                      value: Math.min(100, stats.totalMovies * 2),
                      color: "#34d399"
                    },
                    {
                      label: "User Engagement (Ratings/Users)",
                      value: stats.totalUsers > 0
                        ? Math.min(100, Math.round((stats.totalRatings / stats.totalUsers) * 10))
                        : 0,
                      color: "#60a5fa"
                    },
                    {
                      label: "Content Quality (Reviews Flagged %)",
                      value: stats.totalReviews > 0
                        ? Math.max(0, 100 - Math.round((stats.flaggedReviews / stats.totalReviews) * 100))
                        : 100,
                      color: "#fbbf24"
                    },
                    {
                      label: "User Safety (Blocked %)",
                      value: stats.totalUsers > 0
                        ? Math.max(0, 100 - Math.round((stats.blockedUsers / stats.totalUsers) * 100))
                        : 100,
                      color: "#a78bfa"
                    },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{bar.label}</span>
                        <span style={{ fontSize: "0.85rem", color: bar.color, fontWeight: 700 }}>{bar.value}%</span>
                      </div>
                      <div className="analytics-progress-track">
                        <div
                          className="analytics-progress-bar"
                          style={{ width: `${bar.value}%`, background: bar.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Signups */}
              <div className="admin-table-wrapper">
                <div className="admin-table-header">
                  <h3>🆕 Recent Signups</h3>
                </div>
                {recentUsers.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u) => (
                        <tr key={u.email}>
                          <td><strong>{u.name || u.email}</strong></td>
                          <td>
                            <span className={u.role === "admin" ? "badge-admin" : "badge-user"}>
                              {u.role}
                            </span>
                          </td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-empty-state">No users yet.</div>
                )}
              </div>
            </div>
          </>
        )}
    </AdminLayout>
  );
}

export default AdminAnalytics;
