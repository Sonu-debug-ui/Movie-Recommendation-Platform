import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { supabase } from "../../lib/supabase";
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  formatCooldownTime,
} from "../../utils/rateLimiter";
import LiquidGlassButton from "../../components/LiquidGlassButton";
import KexsioCard from "../../components/KexsioCard";
import "../../css/Admin.css";
import "../../css/AuthModal.css";

function AdminLogin() {
  const { siteName = "CineFlix" } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { signIn, isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect to admin dashboard
  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isLoggedIn, isAdmin, navigate]);

  // Check rate limit status on mount and manage cooldown timer
  useEffect(() => {
    const status = checkRateLimit("admin_login", {
      maxAttempts: 5,
      windowMs: 120000,
      lockoutMs: 60000,
    });
    if (!status.allowed) {
      setCooldownSeconds(status.retryAfterSeconds);
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check rate limit before proceeding
    const limitCheck = checkRateLimit("admin_login", {
      maxAttempts: 5,
      windowMs: 120000,
      lockoutMs: 60000,
    });

    if (!limitCheck.allowed) {
      setCooldownSeconds(limitCheck.retryAfterSeconds);
      setError(
        `Security lockout: Too many failed attempts. Please wait ${formatCooldownTime(
          limitCheck.retryAfterSeconds
        )} before trying again.`
      );
      return;
    }

    setLoading(true);
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const authResult = await signIn(sanitizedEmail, password);
      const userObj = authResult?.user || authResult?.data?.user;
      if (!userObj) throw new Error("No user returned from sign-in.");

      // Check role from auth profile or directly from Supabase profiles
      let userRole = authResult?.profile?.role;
      if (!userRole) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userObj.id)
          .single();
        userRole = prof?.role;
      }

      if (userRole === "admin") {
        // Successful admin login: reset rate limit
        resetRateLimit("admin_login");
        navigate("/admin");
      } else {
        // Record failed authorization attempt
        const record = recordAttempt("admin_login", {
          maxAttempts: 5,
          windowMs: 120000,
          lockoutMs: 60000,
        });
        if (!record.allowed) {
          setCooldownSeconds(record.retryAfterSeconds);
        }
        setError(
          `Access denied. Account "${sanitizedEmail}" does not have admin permissions in the database.`
        );
        setLoading(false);
      }
    } catch (err) {
      // Record failed authentication attempt
      const record = recordAttempt("admin_login", {
        maxAttempts: 5,
        windowMs: 120000,
        lockoutMs: 60000,
      });

      if (!record.allowed) {
        setCooldownSeconds(record.retryAfterSeconds);
        setError(
          `🔒 Security lockout: Maximum login attempts exceeded. Access locked for ${formatCooldownTime(
            record.retryAfterSeconds
          )}.`
        );
      } else {
        const warning =
          record.remainingAttempts <= 2
            ? ` (${record.remainingAttempts} attempt${
                record.remainingAttempts === 1 ? "" : "s"
              } remaining before security lockout)`
            : "";
        setError((err.message || "Sign-in failed. Please check credentials.") + warning);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#090a0f", padding: "2rem"
    }}>
      <KexsioCard className="auth-modal-card" maxTilt={10} style={{ maxWidth: "420px", width: "100%" }}>
        <div className="auth-modal-header">
          <div className="auth-logo">🎬 {siteName}</div>
          <div style={{ marginTop: "8px" }}>
            <span className="admin-badge">Admin Access</span>
          </div>
          <p style={{ marginTop: "10px" }}>Sign in with your administrator credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Admin Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="admin@cineflix.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <LiquidGlassButton
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            label={
              cooldownSeconds > 0
                ? `🔒 Locked (${formatCooldownTime(cooldownSeconds)})`
                : loading
                ? "Authenticating..."
                : "Access Admin Panel"
            }
            icon={cooldownSeconds > 0 ? "🔒" : "🔑"}
            rounded={50}
            padding="13px 20px"
            bg={cooldownSeconds > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(229, 9, 20, 0.3)"}
            hoverBg={cooldownSeconds > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(229, 9, 20, 0.5)"}
            textColor={cooldownSeconds > 0 ? "#fca5a5" : "#ffffff"}
            border={cooldownSeconds > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(229, 9, 20, 0.7)"}
            hoverBorder="rgba(229, 9, 20, 1)"
            shine="rgba(255,255,255,0.25)"
            hoverShine="rgba(255,255,255,0.45)"
            style={{ width: "100%", justifyContent: "center" }}
          />
        </form>

        <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
          <Link to="/" style={{ color: "#64748b", fontSize: "0.88rem", textDecoration: "none" }}>
            ← Back to {siteName}
          </Link>
        </div>
      </KexsioCard>
    </div>
  );
}

export default AdminLogin;
