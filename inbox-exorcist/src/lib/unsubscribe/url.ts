import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type UrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; code: string; reason: string };

function isPrivateIpv4(host: string) {
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function isPrivateIpv6(host: string) {
  const normalized = host.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".test")
  );
}

export async function validateUnsubscribeUrl(
  rawUrl: string,
  { resolveDns = true }: { resolveDns?: boolean } = {},
): Promise<UrlValidationResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, code: "UNSUBSCRIBE_URL_INVALID", reason: "Invalid URL" };
  }

  if (url.protocol !== "https:") {
    return {
      ok: false,
      code: "UNSUBSCRIBE_URL_NOT_HTTPS",
      reason: "Only HTTPS unsubscribe links are allowed",
    };
  }

  if (url.username || url.password) {
    return {
      ok: false,
      code: "UNSUBSCRIBE_URL_CREDENTIALS",
      reason: "Credentials in URLs are blocked",
    };
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isBlockedHostname(hostname)) {
    return {
      ok: false,
      code: "UNSUBSCRIBE_URL_INTERNAL_HOST",
      reason: "Local/internal hostnames are blocked",
    };
  }

  const ipKind = isIP(hostname);
  if (ipKind === 4 && isPrivateIpv4(hostname)) {
    return {
      ok: false,
      code: "UNSUBSCRIBE_URL_PRIVATE_IP",
      reason: "Private IPv4 targets are blocked",
    };
  }

  if (ipKind === 6 && isPrivateIpv6(hostname)) {
    return {
      ok: false,
      code: "UNSUBSCRIBE_URL_PRIVATE_IP",
      reason: "Private IPv6 targets are blocked",
    };
  }

  if (resolveDns && ipKind === 0) {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    const unsafe = addresses.some((address) => {
      if (address.family === 4) {
        return isPrivateIpv4(address.address);
      }
      return isPrivateIpv6(address.address);
    });

    if (unsafe) {
      return {
        ok: false,
        code: "UNSUBSCRIBE_URL_PRIVATE_DNS",
        reason: "DNS resolved to a private/internal address",
      };
    }
  }

  return { ok: true, url };
}
