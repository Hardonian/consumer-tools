import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { isProduction } from "../config.ts";

function getEncryptionKey() {
  const configured = process.env.TOKEN_ENCRYPTION_KEY;
  if (!configured && isProduction()) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required in production");
  }

  const raw =
    configured ||
    "local-development-token-key-not-for-production-inboxexorcist";

  const decoded = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");

  if (decoded.length === 32) {
    return decoded;
  }

  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string) {
  const [prefix, version, ivRaw, tagRaw, encryptedRaw] = payload.split(":");
  if (prefix !== "enc" || version !== "v1" || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Invalid encrypted payload");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
