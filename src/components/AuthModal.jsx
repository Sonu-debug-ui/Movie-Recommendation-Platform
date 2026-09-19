import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSiteSettings } from "../hooks/useSiteSettings";
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  formatCooldownTime,
} from "../utils/rateLimiter";
import LiquidGlassButton from "./LiquidGlassButton";
import KexsioCard from "./KexsioCard";
import "../css/AuthModal.css";

function AuthModal({ onClose }) {
  const { siteName = "CineFlix", tagline = "Your premium global cinema platform" } = useSiteSettings();
  const [activeTab, setActiveTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Check rate limit on mount
  useEffect(() => {
    const status = checkRateLimit("user_auth", {
      maxAttempts: 5,
      windowMs: 120000,
      lockoutMs: 60000,
    });
    if (!status.allowed) {
      setCooldownSeconds(status.retryAfterSeconds);
    }
  }, []);

  // Cooldown countdown timer
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

    // Check rate limit
    const limitCheck = checkRateLimit("user_auth", {
      maxAttempts: 5,
      windowMs: 120000,
      lockoutMs: 60000,
    });

    if (!limitCheck.allowed) {
      setCooldownSeconds(limitCheck.retryAfterSeconds);
      setError(
        `🔒 Security lockout: Too many attempts. Please wait ${formatCooldownTime(
          limitCheck.retryAfterSeconds
        )} before retrying.`
      );
      return;
    }

    setLoading(true);

    try {
      if (activeTab === "signin") {
        await signIn(email, password);
        resetRateLimit("user_auth");
        onClose();
      } else {
        if (!name.trim()) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }
        await signUp(email, password, name);
        resetRateLimit("user_auth");
        setSuccess(true);
      }
    } catch (err) {
      const record = recordAttempt("user_auth", {
        maxAttempts: 5,
        windowMs: 120000,
        lockoutMs: 60000,
      });

      if (!record.allowed) {
        setCooldownSeconds(record.retryAfterSeconds);
        setError(
          `🔒 Security lockout: Maximum attempts exceeded. Try again in ${formatCooldownTime(
            record.retryAfterSeconds
          )}.`
        );
      } else {
        const warning =
          record.remainingAttempts <= 2
            ? ` (${record.remainingAttempts} attempt${
                record.remainingAttempts === 1 ? "" : "s"
              } remaining before security cooldown)`
            : "";
        setError((err.message || "Something went wrong. Please try again.") + warning);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // Redirect handled by Supabase OAuth if enabled
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("cineflix_auth_skipped", "true");
    onClose();
  };

  if (success) {
    return (
      <div className="auth-modal-overlay">
        <KexsioCard className="auth-modal-card" maxTilt={8}>
          <div className="auth-success-state">
            <div className="auth-success-icon">🎉</div>
            <h3>Welcome to {siteName}!</h3>
            <p>Check your email to confirm your account, then sign in.</p>
            <LiquidGlassButton
              label="Go to Sign In"
              icon="→"
              rounded={50}
              padding="11px 28px"
              bg="rgba(229, 9, 20, 0.25)"
              hoverBg="rgba(229, 9, 20, 0.45)"
              border="rgba(229, 9, 20, 0.6)"
              hoverBorder="rgba(229, 9, 20, 0.9)"
              shine="rgba(255,255,255,0.3)"
              hoverShine="rgba(255,255,255,0.5)"
              style={{ marginTop: "1rem" }}
              onClick={() => {
                setSuccess(false);
                setActiveTab("signin");
              }}
            />
          </div>
        </KexsioCard>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay">
      <KexsioCard className="auth-modal-card" maxTilt={8}>
        <div className="auth-modal-header">
          <div className="auth-logo">🎬 {siteName}</div>
          <p>{tagline}</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => { setActiveTab("signin"); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => { setActiveTab("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {activeTab === "signup" && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
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
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <LiquidGlassButton
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            label={
              cooldownSeconds > 0
                ? `🔒 Locked (${formatCooldownTime(cooldownSeconds)})`
                : loading
                ? "Please wait..."
                : activeTab === "signin"
                ? `Sign In to ${siteName}`
                : "Create My Account"
            }
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

        <div className="auth-divider">or</div>

        <LiquidGlassButton
          label="Continue with Google"
          icon="G"
          rounded={50}
          padding="11px 20px"
          bg="rgba(255,255,255,0.08)"
          hoverBg="rgba(255,255,255,0.18)"
          border="rgba(255,255,255,0.3)"
          hoverBorder="rgba(255,255,255,0.6)"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleGoogle}
        />

        <div className="auth-skip-row">
          <p>Just browsing? No problem.</p>
          <LiquidGlassButton
            label="Skip for Now →"
            rounded={50}
            padding="8px 18px"
            fontSize={13}
            bg="rgba(255,255,255,0.04)"
            hoverBg="rgba(255,255,255,0.1)"
            border="rgba(255,255,255,0.12)"
            hoverBorder="rgba(255,255,255,0.3)"
            textColor="#94a3b8"
            hoverText="#e2e8f0"
            onClick={handleSkip}
          />
        </div>
      </KexsioCard>
    </div>
  );
}

export default AuthModal;
