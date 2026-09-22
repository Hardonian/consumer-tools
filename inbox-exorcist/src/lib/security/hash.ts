import { createHmac } from "node:crypto";

import { isProduction } from "../config.ts";

function getHashSecret() {
  const secret =
    process.env.PII_HASH_SECRET ||
    process.env.SESSION_SECRET ||
    (isProduction() ? undefined : "inboxexorcist-local-hash-secret");

  if (!secret) {
    throw new Error("PII_HASH_SECRET or SESSION_SECRET is required");
  }

  return secret;
}

export function hashPii(value: string) {
  return createHmac("sha256", getHashSecret())
    .update(value.trim().toLowerCase())
    .digest("hex");
}
