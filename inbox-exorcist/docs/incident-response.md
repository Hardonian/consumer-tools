# Incident Response

## Severity 1

Token exposure, unauthorized Gmail action, deletion behavior, or cross-user data access.

Actions:

1. Disable OAuth client if needed.
2. Rotate Google OAuth secrets.
3. Rotate `TOKEN_ENCRYPTION_KEY` and invalidate sessions.
4. Review audit events and Gmail filter ids.
5. Notify affected users with exact action scope.

## Severity 2

Gmail quota, filter creation failures, partial undo, or Supabase outage.

Actions:

1. Keep user-facing routes degraded, not crashed.
2. Preserve audit events for completed actions.
3. Disable new quiet actions if reversibility cannot be recorded.
4. Publish status and retry guidance.

## Log Rules

Never log OAuth tokens, email bodies, snippets, attachments, raw Gmail account email, or unsubscribe URLs with personal tokens.
