# Privacy

InboxExorcist scans only what is needed to identify promotional and bulk senders.

We do not store full email bodies, attachments, snippets, or unnecessary subject lines. Classification uses Gmail metadata headers and aggregate sender patterns.

We do not sell inbox data. We do not train external models on inbox content.

Actions are reversible where Gmail exposes filter and label ids. Users can disconnect Gmail and request data deletion from settings.

## What We Store

- User id
- Encrypted Gmail account email (AES-256-GCM)
- Sender email hash (HMAC-SHA256)
- Sender domain
- Classification label
- Action taken (quieted, skipped, unsubscribed)
- Timestamps
- Reversible Gmail filter/label ids
- Aggregate counts
- Audit events

## What We Do Not Store

- Full message bodies
- Attachments
- Gmail snippets
- Raw OAuth tokens (encrypted before storage)
- Raw sender email when a hash is sufficient
- Unsubscribe URLs with user-specific tokens

## How Classification Works

The scanner fetches only these Gmail headers per message:

- `From`, `Sender` — sender identification
- `List-Unsubscribe`, `List-Unsubscribe-Post` — unsubscribe capability
- `List-ID`, `Precedence`, `Auto-Submitted` — bulk mail indicators
- `Subject` — keyword matching for safety classification
- `Reply-To` — reply routing patterns

No message body, snippet, or attachment content is retrieved or stored.

## Data Deletion

`POST /api/me/delete-data` removes all data for the signed-in user:

- Gmail connection (encrypted tokens)
- Scan runs
- Sender candidates
- Sender actions
- Gmail filters
- Unsubscribe attempts
- Allowlist/blocklist entries
- Audit events

The session is then cleared.

## Encryption

OAuth access and refresh tokens are encrypted with AES-256-GCM before storage. The encryption key (`TOKEN_ENCRYPTION_KEY`) is required in production. Gmail account email is also encrypted. Sender emails are hashed with HMAC-SHA256 using `PII_HASH_SECRET`.

## Disconnecting

Users can disconnect Gmail from the settings page. This revokes the Google OAuth token and deletes the connection record.

## Contact

For privacy questions or data deletion requests, use the settings page or contact the repository owner.

See `docs/data-retention.md` for the complete retention policy.
