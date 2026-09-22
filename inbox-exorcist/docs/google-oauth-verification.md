# Google OAuth Verification

InboxExorcist uses restricted Gmail scopes. Before public launch, complete Google's OAuth verification flow.

## App Description

InboxExorcist helps users identify promotional Gmail senders, preview a safe action plan, apply reversible Gmail labels/filters, and attempt standards-based unsubscribe where safe.

## Data Use Statement

The app reads Gmail metadata headers needed to classify bulk senders. It does not store full message bodies, snippets, or attachments. It does not sell inbox data or train external models on inbox content.

## Test Account

Prepare a Gmail test account with promotional newsletters, transactional receipts, and protected sender examples. Confirm:

- Scan reads headers only.
- Preview shows selected high-confidence senders.
- Protected senders are skipped.
- Quiet action creates `InboxExorcist/Quieted`.
- Undo removes created filters.

## Demo Script

1. Open landing page.
2. Click "Exorcise my inbox".
3. Complete Google OAuth.
4. Run scan.
5. Preview senders.
6. Quiet selected senders.
7. Show success counts and undo.
