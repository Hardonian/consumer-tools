const SENSITIVE_FIELDS = new Set([
  "access_token",
  "refresh_token",
  "token",
  "authorization",
  "cookie",
  "password",
  "secret",
  "pi_hash",
  "email",
  "sender_email",
  "body",
  "subject",
  "raw",
  "content",
  "message_body",
  "attachment",
]);

const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\bya29\.[A-Za-z0-9_-]+\b/g,
  /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\b/g,
];

function maskValue(key: string, value: string): string {
  if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
    return "[REDACTED]";
  }
  let masked = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, "[REDACTED]");
  }
  return masked;
}

export function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "string") {
      return maskValue(key, value);
    }
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[CIRCULAR]";
      seen.add(value);
    }
    return value;
  });
}

export function safeLog(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const safeMeta = meta ? JSON.parse(safeStringify(meta)) : undefined;
  const entry = {
    ts: timestamp,
    level,
    service: "InboxExorcist",
    msg: message,
    ...(safeMeta ? { meta: safeMeta } : {}),
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function safeLogInfo(message: string, meta?: Record<string, unknown>) {
  safeLog("info", message, meta);
}

export function safeLogWarn(message: string, meta?: Record<string, unknown>) {
  safeLog("warn", message, meta);
}

export function safeLogError(message: string, meta?: Record<string, unknown>) {
  safeLog("error", message, meta);
}
