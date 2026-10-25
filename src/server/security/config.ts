// Central security settings: the signing secret, session lifetimes and password-policy numbers live here, nowhere else.
// (PDF #2: secrets are kept outside the code and are rotated by changing the environment variable.)

// Explicit switch (not NODE_ENV): the demo is served with `next start` over plain http://localhost, where Secure cookies would break login.
export const IS_PRODUCTION = process.env.VINSIGHT_ENV === "production";

const DEMO_SECRET = "vinsight-demo-secret-change-me-in-production";

function loadSecret(): string {
  const fromEnv = process.env.VINSIGHT_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  // A real deployment must never run with the demo secret: anyone who has read this repo could forge a login cookie.
  if (IS_PRODUCTION) throw new Error("VINSIGHT_SECRET (32+ characters) must be set when running in production.");
  return fromEnv || DEMO_SECRET;
}

/** Key for every signed token. Rotating it logs out everybody and invalidates all outstanding reset links. */
export const SECRET = loadSecret();

/** Idle time before a session expires (PDF #9: members 30 min, admins 15 min). Each request renews it. */
export const SESSION_IDLE_MS = { monitor: 30 * 60 * 1000, admin: 15 * 60 * 1000 } as const;

export const PASSWORD_POLICY = { minLength: 10, maxLength: 128, minCharClasses: 2 } as const;

export const LOGIN_THROTTLE = {
  freeAttempts: 3,           // failures allowed before the waiting time starts
  baseDelayMs: 2_000,        // first wait; doubles for every further failure
  maxDelayMs: 5 * 60 * 1000,
  windowMs: 15 * 60 * 1000,  // failures older than this are forgotten
  maxAccountsPerIp: 10,      // one address failing on this many different accounts is treated as credential stuffing
} as const;

export const MAX_BODY_BYTES = 256 * 1024;
