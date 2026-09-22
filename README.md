# consumer-tools

**Unified consumer protection tools: warranty tracking, review intelligence, and email cleanup.**

Three focused apps that help you make smarter purchases, avoid fake reviews, and reclaim your inbox.

## Repo Map

```
consumer-tools/
├── warranty-weasel/   # Sneak past the fine print before you buy
├── review-radar/       # Ghost the fake reviews — verified-review intelligence
└── inbox-exorcist/     # Find promotional senders, unsubscribe safely, silence noise
```

## Modules

### warranty-weasel

> Sneak past the fine print before you buy.

Paste a product URL and get an instant warranty intelligence report — coverage gaps, claim friction, and fine-print traps surfaced from manufacturer warranty pages.

- **Stack:** Next.js · TypeScript · Vitest
- **Run:** `cd warranty-weasel && npm install && npm run dev`

### review-radar

> Ghost the fake reviews before you buy.

Analyzes product pages (Amazon, Walmart, Best Buy) for suspicious review patterns — temporal clustering, duplicate text, safety concerns, and 15+ other signals — then delivers a BUY / CAUTION / AVOID verdict with confidence and evidence.

- **Stack:** Next.js · TypeScript · Cheerio · Vitest
- **Run:** `cd review-radar && npm install && npm run dev`

### inbox-exorcist

> Your inbox has demons. Exorcise them.

Connect Gmail → identify junk and promotional senders → unsubscribe where safe → create reversible Gmail filters and labels to silence future noise. No accounts, no dashboards, no spam.

- **Stack:** Next.js · TypeScript · Supabase · Vitest
- **Run:** `cd inbox-exorcist && npm install && npm run dev`

## Getting Started

```bash
# Clone the monorepo
git clone https://github.com/Hardonian/consumer-tools.git
cd consumer-tools

# Install all workspaces (requires pnpm)
pnpm install

# Run any module
pnpm --filter warranty-weasel dev
pnpm --filter review-radar dev
pnpm --filter inbox-exorcist dev
```

## Development

Each module is a standalone Next.js app with its own `package.json`. Use pnpm workspaces to manage them together:

```bash
# Lint all
pnpm -r lint

# Test all
pnpm -r test

# Build all
pnpm -r build
```

## Related Repos

### Hardonia Monorepos

| Repo | Purpose |
|------|---------|
| [autopilot](https://github.com/Hardonian/autopilot) | Autonomous agent orchestration |
| [agent-infra](https://github.com/Hardonian/agent-infra) | Agent infrastructure and runtime |
| [agent-edge](https://github.com/Hardonian/agent-edge) | Edge-deployed agent runtimes |
| [model-tools](https://github.com/Hardonian/model-tools) | Model management, evaluation, deployment |
| [api-tools](https://github.com/Hardonian/api-tools) | ComfyUI API gateway, webhook capture, changelog tracking |
| [ops-tools](https://github.com/Hardonian/ops-tools) | Continuity assurance, Terraform drift, developer platform |

### Commercial Repos

| Repo | Purpose |
|------|---------|
| [hardonia-store](https://github.com/Hardonian/hardonia-store) | Hardonia storefront |
| [comfyui-workflow-packs](https://github.com/Hardonian/comfyui-workflow-packs) | ComfyUI workflow packages |
| [content-repo](https://github.com/Hardonian/content-repo) | Content assets |
| [ai-prompt-templates](https://github.com/Hardonian/ai-prompt-templates) | AI prompt templates |
| [ai-ops-toolkit](https://github.com/Hardonian/ai-ops-toolkit) | AI operations toolkit |

## License

Each module retains its own license. See individual `LICENSE` files.