export type RuntimeConfig = {
  appUrl: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri: string;
  tokenEncryptionConfigured: boolean;
  sessionSecretConfigured: boolean;
  piiHashSecretConfigured: boolean;
  supabaseConfigured: boolean;
  paymentsEnabled: boolean;
};

export function getRuntimeConfig(): RuntimeConfig {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000";

  return {
    appUrl,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${appUrl.replace(/\/$/, "")}/api/auth/google/callback`,
    tokenEncryptionConfigured: Boolean(process.env.TOKEN_ENCRYPTION_KEY),
    sessionSecretConfigured: Boolean(process.env.SESSION_SECRET),
    piiHashSecretConfigured: Boolean(process.env.PII_HASH_SECRET),
    supabaseConfigured: Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    paymentsEnabled: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === "true",
  };
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
