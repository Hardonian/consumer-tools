# Classification Rules

The MVP classifier is deterministic.

## Positive Signals

- +25 List-Unsubscribe header exists
- +20 high send frequency
- +15 promotional keywords or Gmail promotions category
- +10 no-reply sender pattern
- +10 bulk/list headers

## Negative Signals

- -40 financial or security keywords
- -30 transactional keywords
- -30 personal reply or engagement signal
- -50 allowlisted domain

## Thresholds

- 80+: one-click quiet eligible
- 50-79: review bucket
- Below 50: skip

## Protected Senders

Always skip or require review for banks, credit cards, payment processors, government, tax, healthcare, legal, school, employer, password reset, login, 2FA, receipts, invoices, shipping updates, personal-looking senders, allowlisted domains, and recent human replies.
