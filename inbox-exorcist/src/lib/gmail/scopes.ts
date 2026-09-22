export const gmailBaseScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.settings.basic",
] as const;

export const gmailMailtoUnsubscribeScope =
  "https://www.googleapis.com/auth/gmail.send";

export function buildRequestedScopes({ includeSend = false } = {}) {
  return [
    ...gmailBaseScopes,
    ...(includeSend ? [gmailMailtoUnsubscribeScope] : []),
  ];
}

export function hasRequiredScopes(grantedScopes: string[]) {
  return gmailBaseScopes
    .filter((scope) => scope.startsWith("https://www.googleapis.com"))
    .every((scope) => grantedScopes.includes(scope));
}
