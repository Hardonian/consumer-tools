# Gmail Scope Rationale

InboxExorcist uses the narrowest viable scopes for the promised one-click quieting flow.

## `openid email profile`

Used to identify the connected Google account and display/account-link the Gmail connection. The email value is encrypted with AES-256-GCM using `TOKEN_ENCRYPTION_KEY` before storage. Sender emails are hashed with SHA-256 using `PII_HASH_SECRET`.

## `https://www.googleapis.com/auth/gmail.modify`

Needed because the product must search recent Gmail messages, fetch metadata headers, create/apply labels, and archive existing messages after confirmation. `gmail.metadata` is not enough for the full flow because the app needs search behavior and message label modification.

InboxExorcist does not delete messages by default. The `removeLabel` (TRASH) operation is not used in the MVP. Messages are archived by removing the `INBOX` label, which preserves them in `All Mail`.

The `gmail.modify` scope also enables:
- `GET /gmail/v1/users/{userId}/messages/list` — listing messages with query strings
- `GET /gmail/v1/users/{userId}/messages/{id}` — fetching message metadata (headers only, no body)
- `POST /gmail/v1/users/{userId}/messages/{id}/modify` — adding/removing labels

## `https://www.googleapis.com/auth/gmail.settings.basic`

Needed to create Gmail filters that skip the inbox and apply the `InboxExorcist/Quieted` label for future messages.

This scope enables:
- `POST /gmail/v1/users/{userId}/settings/filters` — creating filters
- `DELETE /gmail/v1/users/{userId}/settings/filters/{id}` — removing filters (undo)
- `POST /gmail/v1/users/{userId}/labels` — creating the `InboxExorcist/Quieted` label

## Optional `https://www.googleapis.com/auth/gmail.send`

Only requested when `GMAIL_ENABLE_MAILTO_UNSUBSCRIBE=true`. It is for standards-based mailto unsubscribe only after explicit product consent. It is disabled by default in the MVP UI.

The unsubscribe flow validates URLs against a denylist (localhost, private IPs, internal domains), does not follow redirects, and does not execute arbitrary JavaScript. Unsubscribe URLs with personal tokens are redacted from logs by `safe-log`.

## Scope Request Strategy

Scopes are requested in a single OAuth consent screen prompt. The optional `gmail.send` scope can be added dynamically based on feature flags. If a scope is denied during consent, the app enters a degraded state and reports which scopes were not granted.

See the failure registry (`src/lib/gmail/failure-registry.ts`) for scope-related failure codes: `oauth_denied`, `insufficient_scopes`.
