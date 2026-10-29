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

// --- Validation Utilities ---
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return "Full Name is required.";
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return "Name must be at least 2 characters long.";
  }
  if (trimmed.length > 50) {
    return "Name cannot exceed 50 characters.";
  }
  if (/\d/.test(trimmed)) {
    return "Name cannot contain numbers.";
  }
  if (/[^a-zA-Z\s'-]/.test(trimmed)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes.";
  }
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length < 2) {
    return "Name must contain at least 2 alphabetic letters.";
  }
  return "";
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email Address is required.";
  }
  const trimmed = email.trim();
  if (trimmed.includes(" ")) {
    return "Email address cannot contain spaces.";
  }
  if (trimmed.includes("..")) {
    return "Email address cannot contain consecutive dots.";
  }
  // Proper RFC-compliant standard email regex with valid TLD (at least 2 chars)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return "Please enter a valid email address (e.g. name@example.com).";
  }
  if (trimmed.length > 100) {
    return "Email address is too long.";
  }
  return "";
};

export const checkPasswordCriteria = (pwd) => {
  return {
    minLength: (pwd || "").length >= 8,
    hasUpper: /[A-Z]/.test(pwd || ""),
    hasLower: /[a-z]/.test(pwd || ""),
    hasNumber: /[0-9]/.test(pwd || ""),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd || ""),
  };
};

export const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", count: 0 };
  const crit = checkPasswordCriteria(pwd);
  const count = Object.values(crit).filter(Boolean).length;
  if (count <= 2) return { score: 1, label: "weak", count };
  if (count === 3) return { score: 2, label: "fair", count };
  if (count === 4) return { score: 3, label: "good", count };
  return { score: 4, label: "strong", count };
};

export const validatePassword = (pwd, isSignUp = true) => {
  if (!pwd) {
    return "Password is required.";
  }
  if (!isSignUp) {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  }
  const crit = checkPasswordCriteria(pwd);
  if (!crit.minLength) {
    return "Password must be at least 8 characters long.";
  }
  if (!crit.hasUpper) {
    return "Password must include at least one uppercase letter (A-Z).";
  }
  if (!crit.hasLower) {
    return "Password must include at least one lowercase letter (a-z).";
  }
  if (!crit.hasNumber) {
    return "Password must include at least one number (0-9).";
  }
  if (!crit.hasSpecial) {
    return "Password must include at least one special symbol (!@#$%...).";
  }
  return "";
};

function AuthModal({ onClose }) {
  const { siteName = "CineFlix", tagline = "Your premium global cinema platform" } = useSiteSettings();
  const [activeTab, setActiveTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Password criteria & strength calculations
  const pwdCriteria = checkPasswordCriteria(password);
  const strength = getPasswordStrength(password);

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

  // Real-time validation on change
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: validateName(val) }));
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(val, activeTab === "signup"),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Client-side Security Validation
    const isSignUp = activeTab === "signup";
    const errors = {
      name: isSignUp ? validateName(name) : "",
      email: validateEmail(email),
      password: validatePassword(password, isSignUp),
    };

    setFieldErrors(errors);

    if (errors.name || errors.email || errors.password) {
      return;
    }

    // 2. Check rate limit
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

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    try {
      if (activeTab === "signin") {
        await signIn(sanitizedEmail, password);
        resetRateLimit("user_auth");
        onClose();
      } else {
        await signUp(sanitizedEmail, password, sanitizedName);
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

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError("");
    setFieldErrors({ name: "", email: "", password: "" });
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
                switchTab("signin");
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
            type="button"
            className={`auth-tab ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => switchTab("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => switchTab("signup")}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {activeTab === "signup" && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                className={`auth-input ${fieldErrors.name ? "input-error" : ""}`}
                placeholder="e.g. John Doe"
                value={name}
                onChange={handleNameChange}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, name: validateName(name) }))}
                autoComplete="name"
              />
              {fieldErrors.name && (
                <span className="auth-field-error">⚠️ {fieldErrors.name}</span>
              )}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className={`auth-input ${fieldErrors.email ? "input-error" : ""}`}
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="auth-field-error">⚠️ {fieldErrors.email}</span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">
              {activeTab === "signup" ? "Create Password" : "Password"}
            </label>
            <div className="password-input-wrapper">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className={`auth-input ${fieldErrors.password ? "input-error" : ""}`}
                placeholder={activeTab === "signup" ? "At least 8 secure characters" : "Enter your password"}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validatePassword(password, activeTab === "signup"),
                  }))
                }
                autoComplete={activeTab === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="auth-field-error">⚠️ {fieldErrors.password}</span>
            )}

            {activeTab === "signup" && password.length > 0 && (
              <div className="password-strength-box">
                <div className="password-strength-header">
                  <span className="password-strength-label">Security Strength:</span>
                  <span className={`password-strength-score ${strength.label}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="password-strength-bars">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`strength-bar-segment ${
                        step <= strength.score ? `active-${strength.label}` : ""
                      }`}
                    />
                  ))}
                </div>
                <div className="password-reqs-list">
                  <div className={`password-req-item ${pwdCriteria.minLength ? "met" : ""}`}>
                    <span className="req-icon">{pwdCriteria.minLength ? "✓" : "•"}</span>
                    Min 8 characters
                  </div>
                  <div className={`password-req-item ${pwdCriteria.hasUpper && pwdCriteria.hasLower ? "met" : ""}`}>
                    <span className="req-icon">{pwdCriteria.hasUpper && pwdCriteria.hasLower ? "✓" : "•"}</span>
                    Upper & lowercase
                  </div>
                  <div className={`password-req-item ${pwdCriteria.hasNumber ? "met" : ""}`}>
                    <span className="req-icon">{pwdCriteria.hasNumber ? "✓" : "•"}</span>
                    At least 1 number
                  </div>
                  <div className={`password-req-item ${pwdCriteria.hasSpecial ? "met" : ""}`}>
                    <span className="req-icon">{pwdCriteria.hasSpecial ? "✓" : "•"}</span>
                    Special symbol (!@#$)
                  </div>
                </div>
              </div>
            )}
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
