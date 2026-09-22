import { validateUnsubscribeUrl } from "./url.ts";

export type UnsubscribeOption = {
  method: "https" | "mailto";
  target: string;
  oneClickPost?: boolean;
};

export type UnsubscribeResult =
  | { result: "confirmed"; method: "https" | "mailto" }
  | { result: "attempted"; method: "https" | "mailto" }
  | { result: "blocked" | "unavailable" | "failed"; method?: "https" | "mailto"; code: string };

export async function attemptHttpsUnsubscribe(option: UnsubscribeOption) {
  if (option.method !== "https") {
    return { result: "unavailable", code: "UNSUBSCRIBE_NOT_HTTPS" } satisfies UnsubscribeResult;
  }

  const validation = await validateUnsubscribeUrl(option.target);
  if (!validation.ok) {
    return {
      result: "blocked",
      method: "https",
      code: validation.code,
    } satisfies UnsubscribeResult;
  }

  const response = await fetch(validation.url, {
    method: option.oneClickPost ? "POST" : "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
    headers: option.oneClickPost
      ? { "Content-Type": "application/x-www-form-urlencoded" }
      : undefined,
    body: option.oneClickPost ? "List-Unsubscribe=One-Click" : undefined,
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) {
      return {
        result: "blocked",
        method: "https",
        code: "UNSUBSCRIBE_REDIRECT_WITHOUT_LOCATION",
      } satisfies UnsubscribeResult;
    }
    const redirected = new URL(location, validation.url);
    const redirectValidation = await validateUnsubscribeUrl(redirected.toString());
    if (!redirectValidation.ok) {
      return {
        result: "blocked",
        method: "https",
        code: redirectValidation.code,
      } satisfies UnsubscribeResult;
    }
    return {
      result: "blocked",
      method: "https",
      code: "UNSUBSCRIBE_REDIRECT_NOT_FOLLOWED",
    } satisfies UnsubscribeResult;
  }

  if (response.ok) {
    return {
      result: option.oneClickPost ? "confirmed" : "attempted",
      method: "https",
    } satisfies UnsubscribeResult;
  }

  return {
    result: "failed",
    method: "https",
    code: `UNSUBSCRIBE_HTTP_${response.status}`,
  } satisfies UnsubscribeResult;
}
