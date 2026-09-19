import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import AdminLayout from "../../components/AdminLayout";
import Loader from "../../components/Loader";
import LiquidGlassButton from "../../components/LiquidGlassButton";
import {
  checkRateLimit,
  recordAttempt,
  formatCooldownTime,
} from "../../utils/rateLimiter";
import "../../css/Admin.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const { user: currentUser } = useAuth();
  const { showToast } = useToast() || {};

  const notify = (msg, type = "success") => {
    setFeedback({ message: msg, type });
    if (showToast) showToast(msg, type);
    setTimeout(() => setFeedback({ message: "", type: "" }), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      notify("Failed to load user accounts: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBlock = async (userId, currentBlockedStatus, email) => {
    if (userId === currentUser?.id) {
      notify("You cannot block your own admin account!", "error");
      return;
    }

    try {
      const newStatus = !currentBlockedStatus;
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: newStatus })
        .eq("id", userId);

      if (error) throw error;
      notify(
        newStatus
          ? `User "${email}" is now BLOCKED.`
          : `User "${email}" has been UNBLOCKED.`,
        newStatus ? "info" : "success"
      );
      await fetchUsers();
    } catch (err) {
      console.error("Block toggle error:", err);
      notify("Error updating user status: " + err.message, "error");
    }
  };

  const toggleRole = async (userId, currentRole, email) => {
    if (userId === currentUser?.id) {
      notify("You cannot change your own admin role!", "error");
      return;
    }

    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmMsg =
      newRole === "admin"
        ? `Promote "${email}" to Administrator? They will have full dashboard access.`
        : `Demote "${email}" to regular User?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      notify(`Role for "${email}" changed to ${newRole.toUpperCase()}!`, "success");
      await fetchUsers();
    } catch (err) {
      console.error("Role toggle error:", err);
      notify("Error updating role: " + err.message, "error");
    }
  };

  const deleteUser = async (userId, email) => {
    if (userId === currentUser?.id) {
      notify("You cannot delete your own active account!", "error");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently remove user "${email}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Get the current admin's session token to authenticate the Edge Function call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No active session. Please re-login.");

      // Call Edge Function — runs server-side with service_role key to delete from auth.users
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-auth-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      notify(`User "${email}" has been permanently deleted.`, "info");
      await fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      notify("Failed to delete user: " + err.message, "error");
    }
  };


  // Admin Change Password Modal State
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    user: null,
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    loading: false,
    error: "",
    success: "",
  });

  const openPasswordModal = (user) => {
    setPasswordModal({
      isOpen: true,
      user,
      newPassword: "",
      confirmPassword: "",
      showPassword: false,
      loading: false,
      error: "",
      success: "",
    });
  };

  const closePasswordModal = () => {
    setPasswordModal({
      isOpen: false,
      user: null,
      newPassword: "",
      confirmPassword: "",
      showPassword: false,
      loading: false,
      error: "",
      success: "",
    });
  };

  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    const { user, newPassword, confirmPassword } = passwordModal;

    if (!newPassword || newPassword.length < 6) {
      setPasswordModal((prev) => ({
        ...prev,
        error: "Password must be at least 6 characters long.",
      }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordModal((prev) => ({
        ...prev,
        error: "Passwords do not match.",
      }));
      return;
    }

    // Security Rate Limiting: Max 3 password changes per 60 seconds
    const limitCheck = checkRateLimit("admin_pwd_change", {
      maxAttempts: 3,
      windowMs: 60000,
      lockoutMs: 60000,
    });

    if (!limitCheck.allowed) {
      setPasswordModal((prev) => ({
        ...prev,
        error: `🔒 Security Rate Limit: Too many password changes. Please wait ${formatCooldownTime(
          limitCheck.retryAfterSeconds
        )} before trying again.`,
      }));
      return;
    }

    // Record this attempt
    recordAttempt("admin_pwd_change", {
      maxAttempts: 3,
      windowMs: 60000,
      lockoutMs: 60000,
    });

    setPasswordModal((prev) => ({ ...prev, loading: true, error: "", success: "" }));

    try {
      // Call secure database RPC function
      const { data, error } = await supabase.rpc("admin_change_user_password", {
        target_user_id: user.id,
        new_password: newPassword,
      });

      if (error) {
        if (
          error.message?.includes("function") &&
          error.message?.includes("does not exist")
        ) {
          throw new Error(
            "Supabase database function 'admin_change_user_password' is not installed yet. Please run 'supabase_admin_password_setup.sql' in your Supabase SQL Editor."
          );
        }
        throw error;
      }

      const successMsg =
        data?.message || `Password for ${user.email} updated successfully!`;
      setPasswordModal((prev) => ({
        ...prev,
        loading: false,
        success: successMsg,
      }));
      notify(successMsg, "success");

      setTimeout(() => {
        closePasswordModal();
      }, 1500);
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to change user password.",
      }));
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Manage Users">
        <div className="admin-page-header">
          <h1>👥 Manage Users</h1>
          <p>
            View platform members, promote/demote admins, block abusive users, and manage account access.
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
            <h3>Registered Members ({filtered.length})</h3>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <Loader variant="section" text="Loading users from database..." />
          ) : filtered.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User / Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name || "Anonymous User"}</strong>
                        {isSelf && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "0.72rem",
                              color: "#f5c518",
                              background: "rgba(245,197,24,0.15)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            (You)
                          </span>
                        )}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={u.role === "admin" ? "badge-admin" : "badge-user"}
                        >
                          {u.role === "admin" ? "🔑 Admin" : "👤 User"}
                        </span>
                      </td>
                      <td>
                        {u.is_blocked ? (
                          <span className="badge-blocked">🚫 Blocked</span>
                        ) : (
                          <span
                            style={{
                              color: "#10b981",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                            }}
                          >
                            ● Active
                          </span>
                        )}
                      </td>
                      <td>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <LiquidGlassButton
                            label="🔑 Password"
                            rounded={8}
                            padding="5px 12px"
                            fontSize={12}
                            bg="rgba(251,191,36,0.1)"
                            hoverBg="rgba(251,191,36,0.25)"
                            border="rgba(251,191,36,0.35)"
                            hoverBorder="rgba(251,191,36,0.8)"
                            textColor="#fde68a"
                            hoverText="#fff"
                            shine="rgba(255,255,255,0.06)"
                            hoverShine="rgba(255,255,255,0.2)"
                            onClick={() => openPasswordModal(u)}
                          />

                          {!isSelf && (
                            <>
                              <LiquidGlassButton
                                label={u.is_blocked ? "Unblock" : "Block"}
                                rounded={8}
                                padding="5px 12px"
                                fontSize={12}
                                bg={u.is_blocked ? "rgba(16,185,129,0.12)" : "rgba(251,146,60,0.12)"}
                                hoverBg={u.is_blocked ? "rgba(16,185,129,0.3)" : "rgba(251,146,60,0.3)"}
                                border={u.is_blocked ? "rgba(16,185,129,0.4)" : "rgba(251,146,60,0.4)"}
                                hoverBorder={u.is_blocked ? "rgba(16,185,129,0.85)" : "rgba(251,146,60,0.85)"}
                                textColor={u.is_blocked ? "#6ee7b7" : "#fb923c"}
                                hoverText="#fff"
                                shine="rgba(255,255,255,0.06)"
                                hoverShine="rgba(255,255,255,0.2)"
                                onClick={() => toggleBlock(u.id, u.is_blocked, u.email)}
                              />

                              <LiquidGlassButton
                                label={u.role === "admin" ? "Make User" : "Make Admin"}
                                rounded={8}
                                padding="5px 12px"
                                fontSize={12}
                                bg="rgba(245,197,24,0.1)"
                                hoverBg="rgba(245,197,24,0.25)"
                                border="rgba(245,197,24,0.35)"
                                hoverBorder="rgba(245,197,24,0.8)"
                                textColor="#f5c518"
                                hoverText="#fff"
                                shine="rgba(255,255,255,0.06)"
                                hoverShine="rgba(255,255,255,0.2)"
                                onClick={() => toggleRole(u.id, u.role, u.email)}
                              />

                              <LiquidGlassButton
                                label="Delete"
                                rounded={8}
                                padding="5px 12px"
                                fontSize={12}
                                bg="rgba(239,68,68,0.12)"
                                hoverBg="rgba(239,68,68,0.3)"
                                border="rgba(239,68,68,0.4)"
                                hoverBorder="rgba(239,68,68,0.85)"
                                textColor="#fca5a5"
                                hoverText="#fff"
                                shine="rgba(255,255,255,0.06)"
                                hoverShine="rgba(255,255,255,0.2)"
                                onClick={() => deleteUser(u.id, u.email)}
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">No users matching search query.</div>
          )}
        </div>

        {/* Change Password Modal */}
        {passwordModal.isOpen && (
          <div className="admin-modal-backdrop" onClick={closePasswordModal}>
            <div
              className="admin-modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="admin-modal-header">
                <div className="modal-title-wrap">
                  <span className="modal-icon">🔑</span>
                  <div>
                    <h3>Change User Password</h3>
                    <p className="modal-subtitle">
                      Updating password for: <strong>{passwordModal.user?.email}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={closePasswordModal}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdminPasswordSubmit} className="admin-modal-form">
                {passwordModal.error && (
                  <div className="admin-modal-alert error">
                    <span>⚠️</span> {passwordModal.error}
                  </div>
                )}

                {passwordModal.success && (
                  <div className="admin-modal-alert success">
                    <span>✓</span> {passwordModal.success}
                  </div>
                )}

                <div className="admin-modal-field">
                  <label>New Password</label>
                  <div className="modal-input-wrap">
                    <input
                      type={passwordModal.showPassword ? "text" : "password"}
                      placeholder="Enter at least 6 characters..."
                      value={passwordModal.newPassword}
                      onChange={(e) =>
                        setPasswordModal((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                          error: "",
                        }))
                      }
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-eye"
                      onClick={() =>
                        setPasswordModal((prev) => ({
                          ...prev,
                          showPassword: !prev.showPassword,
                        }))
                      }
                      tabIndex="-1"
                      title={passwordModal.showPassword ? "Hide password" : "Show password"}
                    >
                      {passwordModal.showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <div className="admin-modal-field">
                  <label>Confirm New Password</label>
                  <div className="modal-input-wrap">
                    <input
                      type={passwordModal.showPassword ? "text" : "password"}
                      placeholder="Re-enter new password..."
                      value={passwordModal.confirmPassword}
                      onChange={(e) =>
                        setPasswordModal((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                          error: "",
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="admin-modal-tip">
                  💡 <strong>Admin Notice:</strong> Changing this updates the user's encrypted credentials in Supabase Auth immediately.
                </div>

                <div className="admin-modal-actions">
                  <LiquidGlassButton
                    type="button"
                    label="Cancel"
                    rounded={10}
                    padding="10px 24px"
                    bg="rgba(255,255,255,0.06)"
                    hoverBg="rgba(255,255,255,0.14)"
                    border="rgba(255,255,255,0.18)"
                    hoverBorder="rgba(255,255,255,0.45)"
                    textColor="#94a3b8"
                    hoverText="#e2e8f0"
                    disabled={passwordModal.loading}
                    onClick={closePasswordModal}
                  />
                  <LiquidGlassButton
                    type="submit"
                    label={passwordModal.loading ? "Updating..." : "Update Password"}
                    icon="🔒"
                    rounded={10}
                    padding="10px 24px"
                    bg="rgba(229,9,20,0.2)"
                    hoverBg="rgba(229,9,20,0.4)"
                    border="rgba(229,9,20,0.5)"
                    hoverBorder="rgba(229,9,20,0.95)"
                    shine="rgba(255,255,255,0.15)"
                    hoverShine="rgba(255,255,255,0.35)"
                    disabled={passwordModal.loading}
                  />
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}

export default AdminUsers;
