export type GmailHeader = {
  name: string;
  value: string;
};

export type ParsedSender = {
  email?: string;
  domain: string;
  displayName?: string;
};

export function getHeader(headers: GmailHeader[], name: string) {
  const match = headers.find(
    (header) => header.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.value;
}

export function parseSender(value?: string): ParsedSender | null {
  if (!value) {
    return null;
  }

  const bracketMatch = value.match(/<([^>]+)>/);
  const email = (bracketMatch?.[1] || value).trim().toLowerCase();
  const emailMatch = email.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-z0-9.-]+\.[a-z]{2,})/i);
  const domain = emailMatch?.[1]?.toLowerCase();
  if (!domain) {
    return null;
  }

  const displayName = bracketMatch
    ? value
        .slice(0, bracketMatch.index)
        .replace(/^"|"$/g, "")
        .trim()
    : undefined;

  return {
    email: emailMatch?.[0]?.toLowerCase(),
    domain,
    displayName: displayName || undefined,
  };
}

export function extractUnsubscribeMethods(value?: string) {
  const methods = new Set<"https" | "mailto">();
  if (!value) {
    return [];
  }

  for (const part of value.split(",")) {
    const normalized = part.trim().replace(/^<|>$/g, "").toLowerCase();
    if (normalized.startsWith("https://")) {
      methods.add("https");
    }
    if (normalized.startsWith("mailto:")) {
      methods.add("mailto");
    }
  }

  return [...methods];
}

export function extractUnsubscribeTargets(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim().replace(/^<|>$/g, ""))
    .filter((part) => part.startsWith("https://") || part.startsWith("mailto:"));
}
