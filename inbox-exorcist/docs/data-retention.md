# Data Retention

MVP retention is minimal and user-controlled.

## Stored

- User id
- Encrypted Gmail account email
- Sender domain
- Sender email hash when available
- Classification label
- Action taken
- Timestamps
- Reversible Gmail filter/label ids
- Aggregate counts
- Audit events

## Not Stored

- Full message bodies
- Attachments
- Gmail snippets
- Raw OAuth tokens
- Raw sender email when a hash is sufficient
- Unsubscribe URLs with user-specific tokens

## Deletion

`POST /api/me/delete-data` removes connection, scan, candidate, action, filter, unsubscribe, allowlist/blocklist, and audit data for the signed-in user, then clears the session.
