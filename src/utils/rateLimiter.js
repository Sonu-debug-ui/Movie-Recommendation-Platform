/**
 * CineFlix Security Rate Limiter
 * Provides client-side brute force protection, sliding-window throttling,
 * and persistent lockout enforcement across authentication and sensitive actions.
 */

const STORAGE_PREFIX = "cineflix_rate_limit_";

/**
 * Get current rate limit state for an action key
 */
export const getRateLimitState = (actionKey) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${actionKey}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Save rate limit state
 */
const saveRateLimitState = (actionKey, state) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${actionKey}`, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to persist rate limit state:", err);
  }
};

/**
 * Check whether an action is currently allowed or rate-limited
 * @param {string} actionKey - Unique identifier (e.g. 'admin_login', 'auth_signin', 'change_password')
 * @param {object} options
 * @param {number} options.maxAttempts - Maximum allowed attempts within the window (default: 5)
 * @param {number} options.windowMs - Time window in milliseconds (default: 2 minutes = 120,000ms)
 * @param {number} options.lockoutMs - Lockout duration after exceeding limit (default: 60,000ms)
 */
export const checkRateLimit = (
  actionKey,
  { maxAttempts = 5, windowMs = 120000, lockoutMs = 60000 } = {}
) => {
  const now = Date.now();
  const state = getRateLimitState(actionKey);

  if (!state) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
      isLocked: false,
    };
  }

  // Check if currently in active lockout
  if (state.lockedUntil && now < state.lockedUntil) {
    const retryAfterSeconds = Math.ceil((state.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
      isLocked: true,
    };
  }

  // Filter attempts strictly within the sliding time window
  const recentAttempts = (state.timestamps || []).filter(
    (t) => now - t < windowMs
  );

  if (recentAttempts.length >= maxAttempts) {
    const lockedUntil = now + lockoutMs;
    saveRateLimitState(actionKey, {
      timestamps: recentAttempts,
      lockedUntil,
    });
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(lockoutMs / 1000),
      isLocked: true,
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - recentAttempts.length,
    retryAfterSeconds: 0,
    isLocked: false,
  };
};

/**
 * Record an attempt for an action key
 */
export const recordAttempt = (
  actionKey,
  { maxAttempts = 5, windowMs = 120000, lockoutMs = 60000 } = {}
) => {
  const now = Date.now();
  const state = getRateLimitState(actionKey) || { timestamps: [] };

  // Filter timestamps within window
  const timestamps = (state.timestamps || []).filter((t) => now - t < windowMs);
  timestamps.push(now);

  let lockedUntil = null;
  if (timestamps.length >= maxAttempts) {
    lockedUntil = now + lockoutMs;
  }

  saveRateLimitState(actionKey, {
    timestamps,
    lockedUntil,
  });

  return checkRateLimit(actionKey, { maxAttempts, windowMs, lockoutMs });
};

/**
 * Reset / Clear rate limit state (e.g. after successful login or action)
 */
export const resetRateLimit = (actionKey) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${actionKey}`);
  } catch (err) {
    console.warn("Failed to reset rate limit state:", err);
  }
};

/**
 * Format seconds into readable mm:ss format
 */
export const formatCooldownTime = (seconds) => {
  if (seconds <= 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }
  return `${secs}s`;
};
