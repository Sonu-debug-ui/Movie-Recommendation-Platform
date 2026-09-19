import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LiquidGlassButton from "../components/LiquidGlassButton";
import "../css/Profile.css";

function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name });
      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-not-logged-in">
          <div className="profile-lock-icon">🔒</div>
          <h2>Sign In Required</h2>
          <p>You need to be signed in to view your profile.</p>
          <Link to="/" className="btn-profile-primary">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile?.name ? profile.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div className="profile-badge">{profile?.role === "admin" ? "🔑 Admin" : "🎬 Movie Enthusiast"}</div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="profile-form-field">
                <label>Display Name</label>
                <input
                  type="text"
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <LiquidGlassButton
                  type="submit"
                  disabled={saving}
                  label={saving ? "Saving..." : "Save Changes"}
                  icon="💾"
                  rounded={50}
                  padding="10px 22px"
                  bg="rgba(229, 9, 20, 0.25)"
                  hoverBg="rgba(229, 9, 20, 0.45)"
                  border="rgba(229, 9, 20, 0.5)"
                  hoverBorder="rgba(229, 9, 20, 0.9)"
                  shine="rgba(255,255,255,0.2)"
                  hoverShine="rgba(255,255,255,0.4)"
                />
                <LiquidGlassButton
                  type="button"
                  label="Cancel"
                  rounded={50}
                  padding="10px 22px"
                  bg="rgba(255,255,255,0.06)"
                  hoverBg="rgba(255,255,255,0.14)"
                  border="rgba(255,255,255,0.2)"
                  hoverBorder="rgba(255,255,255,0.5)"
                  textColor="#94a3b8"
                  hoverText="#e2e8f0"
                  onClick={() => setEditing(false)}
                />
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <h2>{profile?.name || "Movie Fan"}</h2>
              <p className="profile-email">{user.email}</p>
              <p className="profile-joined">
                Member since {new Date(user.created_at || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </p>
              <LiquidGlassButton
                label="✏️ Edit Profile"
                rounded={50}
                padding="10px 24px"
                bg="rgba(255,255,255,0.07)"
                hoverBg="rgba(255,255,255,0.15)"
                border="rgba(255,255,255,0.2)"
                hoverBorder="rgba(255,255,255,0.5)"
                style={{ marginTop: "0.5rem" }}
                onClick={() => setEditing(true)}
              />
            </div>
          )}
        </div>

        <div className="profile-actions-grid">
          <Link to="/favorites" className="profile-action-card">
            <span className="profile-action-icon">💖</span>
            <span className="profile-action-label">My Favorites</span>
          </Link>
          <Link to="/history" className="profile-action-card">
            <span className="profile-action-icon">🕐</span>
            <span className="profile-action-label">Watch History</span>
          </Link>
          <Link to="/" className="profile-action-card">
            <span className="profile-action-icon">🍿</span>
            <span className="profile-action-label">Browse Movies</span>
          </Link>
          {profile?.role === "admin" && (
            <Link to="/admin" className="profile-action-card admin-card">
              <span className="profile-action-icon">🔑</span>
              <span className="profile-action-label">Admin Dashboard</span>
            </Link>
          )}
        </div>

        <LiquidGlassButton
          label="🚪 Sign Out"
          rounded={50}
          padding="12px 32px"
          bg="rgba(239, 68, 68, 0.12)"
          hoverBg="rgba(239, 68, 68, 0.28)"
          border="rgba(239, 68, 68, 0.35)"
          hoverBorder="rgba(239, 68, 68, 0.8)"
          textColor="#fca5a5"
          hoverText="#fff"
          shine="rgba(255,255,255,0.1)"
          hoverShine="rgba(255,255,255,0.3)"
          style={{ marginTop: "1.5rem" }}
          onClick={handleSignOut}
        />
      </div>
    </div>
  );
}

export default Profile;
