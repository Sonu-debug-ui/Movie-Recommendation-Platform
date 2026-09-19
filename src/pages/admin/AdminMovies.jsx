import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { getSafePosterUrl, handlePosterError } from "../../utils/posterHelper";
import AdminLayout from "../../components/AdminLayout";
import Loader from "../../components/Loader";
import LiquidGlassButton from "../../components/LiquidGlassButton";
import "../../css/Admin.css";

const EMPTY_FORM = {
  title: "",
  genre: "",
  description: "",
  poster_url: "",
  trailer_url: "",
  cast_members: "",
  director: "",
  release_year: "",
};

function AdminMovies() {
  const { siteName = "CineFlix" } = useSiteSettings();
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const { showToast } = useToast() || {};

  const notify = (msg, type = "success") => {
    setFeedback({ message: msg, type });
    if (showToast) showToast(msg, type);
    setTimeout(() => setFeedback({ message: "", type: "" }), 4000);
  };

  const fetchMovies = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMovies(data || []);
    } catch (err) {
      console.error("Fetch movies error:", err);
      notify("Failed to load movies: " + err.message, "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      notify("Movie title is required!", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const { data, error } = await supabase
          .from("movies")
          .update({
            title: form.title.trim(),
            genre: form.genre.trim(),
            description: form.description.trim(),
            poster_url: form.poster_url.trim(),
            trailer_url: form.trailer_url.trim(),
            cast_members: form.cast_members.trim(),
            director: form.director.trim(),
            release_year: form.release_year.trim(),
          })
          .eq("id", editingId)
          .select();

        if (error) throw error;
        notify(`Successfully updated "${form.title}"!`, "success");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("movies")
          .insert([
            {
              title: form.title.trim(),
              genre: form.genre.trim(),
              description: form.description.trim(),
              poster_url: form.poster_url.trim(),
              trailer_url: form.trailer_url.trim(),
              cast_members: form.cast_members.trim(),
              director: form.director.trim(),
              release_year: form.release_year.trim(),
              added_by: user?.id || null,
            },
          ])
          .select();

        if (error) throw error;
        notify(`Movie "${form.title}" added to catalog & live website!`, "success");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      await fetchMovies();
    } catch (err) {
      console.error("Movie save error:", err);
      notify("Error saving movie: " + (err.message || err.details || "Database rejected request"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (movie) => {
    setForm({
      title: movie.title || "",
      genre: movie.genre || "",
      description: movie.description || "",
      poster_url: movie.poster_url || "",
      trailer_url: movie.trailer_url || "",
      cast_members: movie.cast_members || "",
      director: movie.director || "",
      release_year: movie.release_year || "",
    });
    setEditingId(movie.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      const { error } = await supabase.from("movies").delete().eq("id", id);
      if (error) throw error;
      notify(`Deleted "${title}" successfully.`, "info");
      await fetchMovies();
    } catch (err) {
      console.error("Delete error:", err);
      notify("Failed to delete movie: " + err.message, "error");
    }
  };

  const filtered = movies.filter(
    (m) =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.genre?.toLowerCase().includes(search.toLowerCase()) ||
      m.director?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Manage Movies">
        <div className="admin-page-header">
          <h1>🎬 Manage Movies</h1>
          <p>
            Add, update, and manage movies in the Supabase catalog. Movies saved here appear on the {siteName} live site!
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

        <div className="admin-form-card">
          <h3>{editingId ? "✏️ Edit Movie Details" : "➕ Add New Movie to Catalog"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label>Movie Title *</label>
                <input
                  type="text"
                  name="title"
                  className="admin-form-input"
                  placeholder="e.g. Inception, Dune: Part Two"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label>Genre / Categories</label>
                <input
                  type="text"
                  name="genre"
                  className="admin-form-input"
                  placeholder="e.g. Action, Sci-Fi, Thriller"
                  value={form.genre}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field">
                <label>Release Year</label>
                <input
                  type="text"
                  name="release_year"
                  className="admin-form-input"
                  placeholder="e.g. 2024"
                  value={form.release_year}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field">
                <label>Director</label>
                <input
                  type="text"
                  name="director"
                  className="admin-form-input"
                  placeholder="e.g. Christopher Nolan"
                  value={form.director}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field">
                <label>Cast Members</label>
                <input
                  type="text"
                  name="cast_members"
                  className="admin-form-input"
                  placeholder="e.g. Leonardo DiCaprio, Joseph Gordon-Levitt"
                  value={form.cast_members}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field">
                <label>Trailer URL (YouTube link or ID)</label>
                <input
                  type="text"
                  name="trailer_url"
                  className="admin-form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.trailer_url}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field full-width">
                <label>Poster Image URL</label>
                <input
                  type="url"
                  name="poster_url"
                  className="admin-form-input"
                  placeholder="https://example.com/poster.jpg"
                  value={form.poster_url}
                  onChange={handleChange}
                />
                {form.poster_url && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                      src={form.poster_url}
                      alt="Preview"
                      style={{ height: "60px", width: "40px", objectFit: "cover", borderRadius: "4px" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Poster preview</span>
                  </div>
                )}
              </div>

              <div className="admin-form-field full-width">
                <label>Plot Overview / Description</label>
                <textarea
                  name="description"
                  className="admin-form-textarea"
                  placeholder="Write a compelling synopsis of the movie..."
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <LiquidGlassButton
                type="submit"
                disabled={loading}
                label={loading ? "Saving to Database..." : editingId ? "Update Movie" : `Add Movie to ${siteName}`}
                icon={editingId ? "✏️" : "➕"}
                rounded={12}
                padding="11px 24px"
                bg="rgba(229, 9, 20, 0.2)"
                hoverBg="rgba(229, 9, 20, 0.4)"
                border="rgba(229, 9, 20, 0.5)"
                hoverBorder="rgba(229, 9, 20, 0.95)"
                shine="rgba(255,255,255,0.15)"
                hoverShine="rgba(255,255,255,0.35)"
              />
              {editingId && (
                <LiquidGlassButton
                  type="button"
                  label="Cancel Edit"
                  rounded={12}
                  padding="11px 24px"
                  bg="rgba(255,255,255,0.06)"
                  hoverBg="rgba(255,255,255,0.14)"
                  border="rgba(255,255,255,0.18)"
                  hoverBorder="rgba(255,255,255,0.45)"
                  textColor="#94a3b8"
                  hoverText="#e2e8f0"
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setEditingId(null);
                  }}
                />
              )}
            </div>
          </form>
        </div>

        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <h3>Database Catalog Movies ({filtered.length})</h3>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by title, genre, director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {fetching ? (
            <Loader variant="section" text="Loading movies from Supabase..." />
          ) : filtered.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Year</th>
                  <th>Director</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((movie) => (
                  <tr key={movie.id}>
                    <td style={{ width: "50px" }}>
                      <img
                        src={getSafePosterUrl(movie.poster_url, movie.title, movie.release_year, movie.genre)}
                        alt={movie.title}
                        style={{
                          width: "36px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          handlePosterError(e, movie.title, movie.release_year, movie.genre)
                        }
                      />
                    </td>
                    <td>
                      <strong>{movie.title}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          background: "rgba(229,9,20,0.12)",
                          color: "#ff6b6b",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {movie.genre || "General"}
                      </span>
                    </td>
                    <td>{movie.release_year || "—"}</td>
                    <td>{movie.director || "—"}</td>
                    <td>
                      <div className="admin-action-btns">
                        <LiquidGlassButton
                          label="Edit"
                          rounded={8}
                          padding="6px 14px"
                          fontSize={13}
                          bg="rgba(59, 130, 246, 0.15)"
                          hoverBg="rgba(59, 130, 246, 0.35)"
                          border="rgba(59, 130, 246, 0.4)"
                          hoverBorder="rgba(59, 130, 246, 0.85)"
                          textColor="#93c5fd"
                          hoverText="#fff"
                          shine="rgba(255,255,255,0.1)"
                          hoverShine="rgba(255,255,255,0.25)"
                          onClick={() => handleEdit(movie)}
                        />
                        <LiquidGlassButton
                          label="Delete"
                          rounded={8}
                          padding="6px 14px"
                          fontSize={13}
                          bg="rgba(239, 68, 68, 0.12)"
                          hoverBg="rgba(239, 68, 68, 0.3)"
                          border="rgba(239, 68, 68, 0.4)"
                          hoverBorder="rgba(239, 68, 68, 0.85)"
                          textColor="#fca5a5"
                          hoverText="#fff"
                          shine="rgba(255,255,255,0.1)"
                          hoverShine="rgba(255,255,255,0.25)"
                          onClick={() => handleDelete(movie.id, movie.title)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">
              {search
                ? `No movies matching "${search}"`
                : "No movies found in the database. Add your first movie above!"}
            </div>
          )}
        </div>
    </AdminLayout>
  );
}

export default AdminMovies;
