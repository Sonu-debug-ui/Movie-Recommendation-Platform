import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import AdminLayout from "../../components/AdminLayout";
import Loader from "../../components/Loader";
import LiquidGlassButton from "../../components/LiquidGlassButton";
import "../../css/Admin.css";

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [ratingsMap, setRatingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'flagged'
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const { showToast } = useToast() || {};

  const notify = (msg, type = "success") => {
    setFeedback({ message: msg, type });
    if (showToast) showToast(msg, type);
    setTimeout(() => setFeedback({ message: "", type: "" }), 4000);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [reviewsRes, ratingsRes] = await Promise.all([
        supabase
          .from("reviews")
          .select("*, profiles(name, email)")
          .order("created_at", { ascending: false }),
        supabase.from("ratings").select("user_id, movie_id, stars"),
      ]);

      if (reviewsRes.error) throw reviewsRes.error;

      // Build quick lookup map for ratings by user_id + movie_id
      const map = {};
      (ratingsRes.data || []).forEach((r) => {
        map[`${r.user_id}_${r.movie_id}`] = r.stars;
      });
      setRatingsMap(map);
      setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error("Fetch reviews error:", err);
      notify("Failed to load reviews from database: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const flagReview = async (id, isFlagged) => {
    try {
      const newStatus = !isFlagged;
      const { error } = await supabase
        .from("reviews")
        .update({ is_flagged: newStatus })
        .eq("id", id);

      if (error) throw error;
      notify(
        newStatus ? "Review has been flagged as suspicious." : "Review unflagged.",
        newStatus ? "info" : "success"
      );
      await fetchReviews();
    } catch (err) {
      console.error("Flag error:", err);
      notify("Failed to update review flag: " + err.message, "error");
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Permanently delete this user review from the database?")) {
      return;
    }
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      notify("Review removed from database.", "info");
      await fetchReviews();
    } catch (err) {
      console.error("Delete review error:", err);
      notify("Failed to delete review: " + err.message, "error");
    }
  };

  const filtered = reviews.filter((r) => {
    const matchesSearch =
      r.content?.toLowerCase().includes(search.toLowerCase()) ||
      r.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.movie_id?.toLowerCase().includes(search.toLowerCase());

    if (filterMode === "flagged") {
      return matchesSearch && r.is_flagged;
    }
    return matchesSearch;
  });

  return (
    <AdminLayout title="Reviews & Ratings Moderation">
        <div className="admin-page-header">
          <h1>⭐ Reviews & Ratings Moderation</h1>
          <p>
            Moderate community feedback, flag offensive comments, and manage movie reviews stored in Supabase.
          </p>
        </div>

        {feedback.message && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              background:
                feedback.type === "error"
                  ? "rgba(239, 68, 68, 0.15)"
                  : feedback.type === "info"
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(16, 185, 129, 0.15)",
              border: `1px solid ${
                feedback.type === "error"
                  ? "#ef4444"
                  : feedback.type === "info"
                  ? "#3b82f6"
                  : "#10b981"
              }`,
              color:
                feedback.type === "error"
                  ? "#fca5a5"
                  : feedback.type === "info"
                  ? "#93c5fd"
                  : "#6ee7b7",
              fontWeight: 600,
            }}
          >
            {feedback.type === "error" ? "⚠️ " : "✓ "} {feedback.message}
          </div>
        )}

        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h3>Community Reviews ({filtered.length})</h3>
              <div style={{ display: "flex", gap: "6px" }}>
                <LiquidGlassButton
                  label="All Reviews"
                  rounded={20}
                  padding="5px 14px"
                  fontSize={13}
                  bg={filterMode === "all" ? "rgba(229,9,20,0.2)" : "rgba(255,255,255,0.06)"}
                  hoverBg="rgba(229,9,20,0.3)"
                  border={filterMode === "all" ? "rgba(229,9,20,0.5)" : "rgba(255,255,255,0.15)"}
                  hoverBorder="rgba(229,9,20,0.8)"
                  textColor={filterMode === "all" ? "#ff4d4d" : "#94a3b8"}
                  hoverText="#ff4d4d"
                  shine="rgba(255,255,255,0.06)"
                  hoverShine="rgba(255,255,255,0.15)"
                  onClick={() => setFilterMode("all")}
                />
                <LiquidGlassButton
                  label="⚑ Flagged Only"
                  rounded={20}
                  padding="5px 14px"
                  fontSize={13}
                  bg={filterMode === "flagged" ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.06)"}
                  hoverBg="rgba(251,146,60,0.3)"
                  border={filterMode === "flagged" ? "rgba(251,146,60,0.5)" : "rgba(255,255,255,0.15)"}
                  hoverBorder="rgba(251,146,60,0.8)"
                  textColor={filterMode === "flagged" ? "#fb923c" : "#94a3b8"}
                  hoverText="#fb923c"
                  shine="rgba(255,255,255,0.06)"
                  hoverShine="rgba(255,255,255,0.15)"
                  onClick={() => setFilterMode("flagged")}
                />
              </div>
            </div>

            <input
              type="text"
              className="admin-search-input"
              placeholder="Search reviewer, text, or movie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <Loader variant="section" text="Loading reviews from database..." />
          ) : filtered.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Rating</th>
                  <th>Movie Target</th>
                  <th>Review Note</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const ratingStars = ratingsMap[`${r.user_id}_${r.movie_id}`];
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.profiles?.name || "User"}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {r.profiles?.email}
                        </div>
                      </td>
                      <td>
                        {ratingStars ? (
                          <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                            {"★".repeat(ratingStars)} ({ratingStars}/5)
                          </span>
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontFamily: "monospace",
                          }}
                        >
                          {r.movie_id}
                        </span>
                      </td>
                      <td style={{ maxWidth: "320px", color: "#e2e8f0" }}>
                        "{r.content}"
                      </td>
                      <td>
                        {r.is_flagged ? (
                          <span className="badge-flagged">⚑ Flagged</span>
                        ) : (
                          <span style={{ color: "#10b981", fontSize: "0.8rem" }}>
                            ✓ Clean
                          </span>
                        )}
                      </td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-action-btns">
                          <LiquidGlassButton
                            label={r.is_flagged ? "Unflag" : "Flag"}
                            rounded={8}
                            padding="5px 12px"
                            fontSize={13}
                            bg={r.is_flagged ? "rgba(16,185,129,0.12)" : "rgba(251,146,60,0.12)"}
                            hoverBg={r.is_flagged ? "rgba(16,185,129,0.3)" : "rgba(251,146,60,0.3)"}
                            border={r.is_flagged ? "rgba(16,185,129,0.4)" : "rgba(251,146,60,0.4)"}
                            hoverBorder={r.is_flagged ? "rgba(16,185,129,0.85)" : "rgba(251,146,60,0.85)"}
                            textColor={r.is_flagged ? "#6ee7b7" : "#fb923c"}
                            hoverText="#fff"
                            shine="rgba(255,255,255,0.06)"
                            hoverShine="rgba(255,255,255,0.2)"
                            onClick={() => flagReview(r.id, r.is_flagged)}
                          />
                          <LiquidGlassButton
                            label="Delete"
                            rounded={8}
                            padding="5px 12px"
                            fontSize={13}
                            bg="rgba(239,68,68,0.12)"
                            hoverBg="rgba(239,68,68,0.3)"
                            border="rgba(239,68,68,0.4)"
                            hoverBorder="rgba(239,68,68,0.85)"
                            textColor="#fca5a5"
                            hoverText="#fff"
                            shine="rgba(255,255,255,0.06)"
                            hoverShine="rgba(255,255,255,0.2)"
                            onClick={() => deleteReview(r.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">
              {filterMode === "flagged"
                ? "No flagged reviews right now. Platform content is clean!"
                : "No reviews submitted yet. When users review movies, they will appear here."}
            </div>
          )}
        </div>
    </AdminLayout>
  );
}

export default AdminReviews;
