# Architecture

## Platform Context

**consumer-tools** is one of seven Hardonia monorepos. It provides consumer-facing protection tools — warranty intelligence, review analysis, and inbox cleanup — built as standalone Next.js apps that share a pnpm workspace.

## Position in the Hardonia Platform

```
┌─────────────────────────────────────────────────────────────────┐
│                        Hardonia Platform                        │
├──────────────┬──────────────┬──────────────┬───────────────────-─┤
│  Consumer    │  API         │  Ops         │  Infra / AI         │
│  Surface     │  Surface     │  Surface     │  Core               │
├──────────────┼──────────────┼──────────────┼─────────────────────┤
│ consumer-tools│ api-tools   │ ops-tools    │ autopilot           │
│              │              │              │ agent-infra         │
│              │              │              │ agent-edge          │
│              │              │              │ model-tools         │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
```

| Layer | Repo | Purpose |
|-------|------|---------|
| Consumer Surface | **[consumer-tools](https://github.com/Hardonian/consumer-tools)** | Warranty tracking, review intelligence, inbox cleanup |
| API Surface | **[api-tools](https://github.com/Hardonian/api-tools)** | ComfyUI API gateway, webhook capture, changelog tracking |
| Ops Surface | **[ops-tools](https://github.com/Hardonian/ops-tools)** | Continuity assurance, Terraform drift, developer platform |
| Core | **[autopilot](https://github.com/Hardonian/autopilot)** | Autonomous agent orchestration |
| Core | **[agent-infra](https://github.com/Hardonian/agent-infra)** | Agent infrastructure and runtime |
| Core | **[agent-edge](https://github.com/Hardonian/agent-edge)** | Edge-deployed agent runtimes |
| Core | **[model-tools](https://github.com/Hardonian/model-tools)** | Model management, evaluation, deployment |

## Internal Architecture

```
consumer-tools/
├── warranty-weasel/     # Warranty intelligence from product URLs
├── review-radar/        # Fake-review detection with BUY/CAUTION/AVOID verdicts
├── inbox-exorcist/      # Gmail promotional noise cleanup
└── package.json         # pnpm workspace root
```

Each module is a standalone Next.js application with its own dependencies, tests, and deployment configuration. They share no runtime code but are developed and tested together via pnpm workspaces.

## Cross-Repo Dependencies

- **api-tools/comfyui-api** — may be used as a backend for image generation in review-radar
- **ops-tools/golden-path** — service catalog references consumer-tools modules
- **model-tools** — review-radar can use model-tools for ML-based review scoring
