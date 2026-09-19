import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import AdminLayout from "../../components/AdminLayout";
import LiquidGlassButton from "../../components/LiquidGlassButton";
import "../../css/Admin.css";
import "../../css/AdminSettings.css";

const DEFAULT_SETTINGS = {
  siteName: "CineFlix",
  tagline: "Your Premium Global Cinema Platform",
  moviesPerPage: "20",
  showWelcomeModal: true,
  allowRegistration: true,
  requireEmailVerification: false,
  featuredGenre: "Action",
  bannerText: "",
};

function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const { showToast } = useToast() || {};

  const notify = (msg, type = "success") => {
    setFeedback({ message: msg, type });
    if (showToast) showToast(msg, type);
    setTimeout(() => setFeedback({ message: "", type: "" }), 4000);
  };

  useEffect(() => {
    const loadSettings = async () => {
      // 1. Try local cache first for fast display
      try {
        const local = localStorage.getItem("cineflix_admin_settings");
        if (local) {
          const parsed = JSON.parse(local);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Local settings load error:", e);
      }

      // 2. Query Supabase site_settings table if present
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .limit(1);

        if (!error && data && data.length > 0) {
          const dbRow = data[0];
          const mapped = {
            siteName: dbRow.site_name || "CineFlix",
            tagline: dbRow.tagline || "Your Premium Global Cinema Platform",
            moviesPerPage: String(dbRow.movies_per_page || 20),
            showWelcomeModal: dbRow.show_welcome_modal ?? true,
            allowRegistration: dbRow.allow_registration ?? true,
            featuredGenre: dbRow.featured_genre || "Action",
            bannerText: dbRow.banner_text || "",
          };
          setSettings((prev) => ({ ...prev, ...mapped }));
          localStorage.setItem("cineflix_admin_settings", JSON.stringify(mapped));
        }
      } catch (err) {
        // Table might not exist yet; gracefully handled
      }
    };

    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Save to localStorage for instant website reactivity
    localStorage.setItem("cineflix_admin_settings", JSON.stringify(settings));

    // Try persisting to Supabase site_settings table
    try {
      const { data: existingRows } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        await supabase
          .from("site_settings")
          .update({
            site_name: settings.siteName,
            tagline: settings.tagline,
            movies_per_page: parseInt(settings.moviesPerPage) || 20,
            show_welcome_modal: settings.showWelcomeModal,
            allow_registration: settings.allowRegistration,
            featured_genre: settings.featuredGenre,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRows[0].id);
      } else {
        await supabase.from("site_settings").insert([
          {
            site_name: settings.siteName,
            tagline: settings.tagline,
            movies_per_page: parseInt(settings.moviesPerPage) || 20,
            show_welcome_modal: settings.showWelcomeModal,
            allow_registration: settings.allowRegistration,
            featured_genre: settings.featuredGenre,
          },
        ]);
      }
    } catch (err) {
      console.warn("Supabase site_settings sync note:", err.message);
    }

    // Broadcast update event so all open tabs and components react immediately
    window.dispatchEvent(
      new CustomEvent("cineflix_settings_updated", { detail: settings })
    );

    setSaved(true);
    notify("Settings saved & updated across CineFlix!", "success");
    setLoading(false);
    setTimeout(() => setSaved(false), 3500);
  };

  const handleReset = () => {
    if (!window.confirm("Reset all settings to original defaults?")) return;
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(
      "cineflix_admin_settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );
    window.dispatchEvent(
      new CustomEvent("cineflix_settings_updated", { detail: DEFAULT_SETTINGS })
    );
    notify("Reset to default settings.", "info");
  };

  return (
    <AdminLayout title="System Settings">
        <div className="admin-page-header">
          <h1>⚙️ System Settings</h1>
          <p>
            Configure platform branding, pagination limits, authentication controls, and recommendation preferences.
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

        <form onSubmit={handleSave}>
          {/* Site Identity */}
          <div className="admin-form-card">
            <h3>🎬 Branding & Site Identity</h3>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label>Platform Name</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={settings.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                  placeholder="e.g. CineFlix"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label>Tagline / Headline</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={settings.tagline}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  placeholder="e.g. Your Premium Global Cinema Platform"
                />
              </div>
            </div>
          </div>

          {/* Browse & Discovery Settings */}
          <div className="admin-form-card">
            <h3>🍿 Browse & Discovery Settings</h3>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label>Movies Per Page (Pagination Limit)</label>
                <select
                  className="admin-form-input"
                  value={settings.moviesPerPage}
                  onChange={(e) => handleChange("moviesPerPage", e.target.value)}
                >
                  <option value="10">10 Movies per page</option>
                  <option value="20">20 Movies per page (Recommended)</option>
                  <option value="30">30 Movies per page</option>
                  <option value="50">50 Movies per page</option>
                </select>
              </div>

              <div className="admin-form-field">
                <label>Default Highlight Category</label>
                <select
                  className="admin-form-input"
                  value={settings.featuredGenre}
                  onChange={(e) => handleChange("featuredGenre", e.target.value)}
                >
                  {[
                    "Action",
                    "Bollywood",
                    "Hollywood",
                    "Sci-Fi",
                    "Drama",
                    "Comedy",
                    "Horror",
                    "Romance",
                    "K-Drama",
                    "Anime",
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Auth & Access Controls */}
          <div className="admin-form-card">
            <h3>🔐 Authentication & Access Controls</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">
                    Show Welcome Modal to New Visitors
                  </span>
                  <span className="settings-toggle-desc">
                    Prompts first-time visitors with an invitation to sign in or skip.
                  </span>
                </div>
                <button
                  type="button"
                  className={`settings-toggle-btn ${
                    settings.showWelcomeModal ? "on" : "off"
                  }`}
                  onClick={() =>
                    handleChange(
                      "showWelcomeModal",
                      !settings.showWelcomeModal
                    )
                  }
                >
                  <span className="settings-toggle-knob" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">
                    Allow Public User Registrations
                  </span>
                  <span className="settings-toggle-desc">
                    When enabled, anyone can create an account. When disabled, only admins can register users.
                  </span>
                </div>
                <button
                  type="button"
                  className={`settings-toggle-btn ${
                    settings.allowRegistration ? "on" : "off"
                  }`}
                  onClick={() =>
                    handleChange(
                      "allowRegistration",
                      !settings.allowRegistration
                    )
                  }
                >
                  <span className="settings-toggle-knob" />
                </button>
              </div>
            </div>
          </div>

          <div className="admin-form-card settings-danger-zone">
            <h3>⚠️ Danger Zone & Reset Controls</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <LiquidGlassButton
                type="button"
                label="🧹 Clear Session Storage"
                rounded={12}
                padding="10px 18px"
                fontSize={14}
                bg="rgba(239, 68, 68, 0.1)"
                hoverBg="rgba(239, 68, 68, 0.25)"
                border="rgba(239, 68, 68, 0.4)"
                hoverBorder="rgba(239, 68, 68, 0.8)"
                textColor="#fca5a5"
                hoverText="#fff"
                shine="rgba(255,255,255,0.08)"
                hoverShine="rgba(255,255,255,0.2)"
                onClick={() => {
                  if (window.confirm("Clear session state on this browser? You will stay logged in.")) {
                    sessionStorage.clear();
                    notify("Session storage cleared.", "info");
                  }
                }}
              />

              <LiquidGlassButton
                type="button"
                label="🔄 Restore Defaults"
                rounded={12}
                padding="10px 18px"
                fontSize={14}
                bg="rgba(251, 191, 36, 0.1)"
                hoverBg="rgba(251, 191, 36, 0.25)"
                border="rgba(251, 191, 36, 0.4)"
                hoverBorder="rgba(251, 191, 36, 0.8)"
                textColor="#fde68a"
                hoverText="#fff"
                shine="rgba(255,255,255,0.08)"
                hoverShine="rgba(255,255,255,0.2)"
                onClick={handleReset}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="admin-form-actions">
            <LiquidGlassButton
              type="submit"
              disabled={loading}
              label={loading ? "Saving..." : saved ? "✓ Settings Applied!" : "💾 Save All Settings"}
              rounded={14}
              padding="13px 32px"
              fontSize={15}
              fontWeight={700}
              bg="rgba(229, 9, 20, 0.2)"
              hoverBg="rgba(229, 9, 20, 0.4)"
              border="rgba(229, 9, 20, 0.5)"
              hoverBorder="rgba(229, 9, 20, 0.95)"
              shine="rgba(255,255,255,0.2)"
              hoverShine="rgba(255,255,255,0.4)"
              style={{ minWidth: "180px", justifyContent: "center" }}
            />
          </div>
        </form>
    </AdminLayout>
  );
}

export default AdminSettings;
