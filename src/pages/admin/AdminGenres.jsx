import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import AdminLayout from "../../components/AdminLayout";
import LiquidGlassButton from "../../components/LiquidGlassButton";
import "../../css/Admin.css";

const EMPTY_FORM = { name: "", description: "" };

function AdminGenres() {
  const { siteName = "CineFlix" } = useSiteSettings();
  const [genres, setGenres] = useState([]);
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

  const fetchGenres = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("genres")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setGenres(data || []);
    } catch (err) {
      console.error("Genre fetch error:", err);
      notify("Failed to load genres: " + err.message, "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const genreName = form.name.trim();
    if (!genreName) {
      notify("Genre name is required!", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("genres")
          .update({
            name: genreName,
            description: form.description.trim(),
          })
          .eq("id", editingId);

        if (error) throw error;
        notify(`Updated genre "${genreName}"!`, "success");
      } else {
        const { error } = await supabase.from("genres").insert([
          {
            name: genreName,
            description: form.description.trim() || `${genreName} movies`,
          },
        ]);

        if (error) throw error;
        notify(`Added new genre "${genreName}"!`, "success");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      await fetchGenres();
    } catch (err) {
      console.error("Genre save error:", err);
      notify("Failed to save genre: " + (err.message || "Unique constraint or permission error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (genreName) => {
    try {
      const existing = genres.some(
        (g) => g.name.toLowerCase() === genreName.toLowerCase()
      );
      if (existing) {
        notify(`"${genreName}" is already in your database.`, "info");
        return;
      }

      const { error } = await supabase.from("genres").insert([
        {
          name: genreName,
          description: `${genreName} films and cinema`,
        },
      ]);

      if (error) throw error;
      notify(`Added "${genreName}" genre!`, "success");
      await fetchGenres();
    } catch (err) {
      console.error("Quick add genre error:", err);
      notify(`Failed to add "${genreName}": ` + err.message, "error");
    }
  };

  const handleEdit = (genre) => {
    setForm({ name: genre.name, description: genre.description || "" });
    setEditingId(genre.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete genre "${name}"?`)) return;
    try {
      const { error } = await supabase.from("genres").delete().eq("id", id);
      if (error) throw error;
      notify(`Deleted genre "${name}".`, "info");
      await fetchGenres();
    } catch (err) {
      console.error("Delete genre error:", err);
      notify("Failed to delete genre: " + err.message, "error");
    }
  };

  const filtered = genres.filter(
    (g) =>
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase())
  );

  const quickGenres = [
    "Action",
    "Adventure",
    "Animation",
    "Bollywood",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Fantasy",
    "Horror",
    "International",
    "K-Drama",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller",
  ];

  return (
    <AdminLayout title="Manage Genres">
        <div className="admin-page-header">
          <h1>🏷️ Manage Genres & Categories</h1>
          <p>
            Create and maintain movie categories. These genres dynamically populate the filter bar on {siteName}!
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

        {/* Quick Add Row */}
        <div className="admin-form-card">
          <h3>⚡ Quick Add Common Categories</h3>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Click any button below to instantly register the genre into the database:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {quickGenres.map((g) => {
              const isPresent = genres.some(
                (existing) => existing.name.toLowerCase() === g.toLowerCase()
              );
              return (
                <LiquidGlassButton
                  key={g}
                  label={(isPresent ? "✓ " : "+ ") + g}
                  rounded={20}
                  padding="6px 14px"
                  fontSize={13}
                  bg={isPresent ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)"}
                  hoverBg={isPresent ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.12)"}
                  border={isPresent ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.12)"}
                  hoverBorder={isPresent ? "rgba(16,185,129,0.8)" : "rgba(255,255,255,0.4)"}
                  textColor={isPresent ? "#6ee7b7" : "#94a3b8"}
                  hoverText={isPresent ? "#fff" : "#e2e8f0"}
                  shine="rgba(255,255,255,0.04)"
                  hoverShine="rgba(255,255,255,0.12)"
                  onClick={() => handleQuickAdd(g)}
                />
              );
            })}
          </div>
        </div>

        {/* Add / Edit Form */}
        <div className="admin-form-card">
          <h3>{editingId ? "✏️ Edit Genre" : "➕ Create Custom Genre"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label>Genre / Category Name *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Cyberpunk, Anime, Tollywood"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="admin-form-field">
                <label>Description (optional)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Brief description of this genre"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <LiquidGlassButton
                type="submit"
                disabled={loading}
                label={loading ? "Saving to Database..." : editingId ? "Update Genre" : "Save Genre"}
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

        {/* Genres Table */}
        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <h3>Registered Genres ({filtered.length})</h3>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search genres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {fetching ? (
            <div className="admin-empty-state">Loading genres from database...</div>
          ) : filtered.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Genre Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((genre, i) => (
                  <tr key={genre.id}>
                    <td>{i + 1}</td>
                    <td>
                      <span
                        style={{
                          background: "rgba(229,9,20,0.15)",
                          border: "1px solid rgba(229,9,20,0.3)",
                          color: "#ff6b6b",
                          padding: "3px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      >
                        {genre.name}
                      </span>
                    </td>
                    <td>{genre.description || "—"}</td>
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
                          onClick={() => handleEdit(genre)}
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
                          onClick={() => handleDelete(genre.id, genre.name)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">
              No genres found. Click any quick-add button above to add categories!
            </div>
          )}
        </div>
    </AdminLayout>
  );
}

export default AdminGenres;
