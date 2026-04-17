# Build Task: dns-propagation-radar

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: dns-propagation-radar
HEADLINE: Query 40 global nameservers every 60 seconds during a DNS change and see the exact moment the world catches up
WHAT: A tool that lets you enter a domain and record type, then polls major global resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1, Quad9, regional resolvers in EU/AP/SA) and displays live propagation status on a world map. Get an email or Discord ping when 95% of resolvers see the new value.
WHY: We literally hit this exact pain ourselves this session with umami.microtool.dev. Existing tools (dnschecker.org) are ad-laden, slow, and have no alerts. Clear SEO keyword: "dns propagation check" is a high-volume query.
WHO PAYS: Developers and ops folks mid-migration — anyone pointing a domain at a new provider (Vercel, Netlify, Cloudflare, Hetzner, AWS) and waiting anxiously.
NICHE: developer-tools
PRICE: $$12/mo

ARCHITECTURE SPEC:
A Next.js app with a real-time dashboard that polls 40+ global DNS resolvers every 60 seconds, displays propagation status on an interactive world map, and sends notifications when thresholds are met. Uses WebSockets for live updates and a background job queue for DNS polling.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/api/dns-check/route.ts
- app/api/webhooks/lemonsqueezy/route.ts
- app/api/notifications/route.ts
- components/dns-map.tsx
- components/resolver-status.tsx
- components/pricing-table.tsx
- lib/dns-resolvers.ts
- lib/dns-poller.ts
- lib/websocket-server.ts
- lib/notification-service.ts
- lib/lemonsqueezy.ts
- prisma/schema.prisma

DEPENDENCIES: next, tailwindcss, prisma, @prisma/client, ws, dns-packet, node-cron, resend, discord.js, leaflet, react-leaflet, @lemonsqueezy/lemonsqueezy.js, zod, lucide-react

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- NO HEAVY ORMs: Do NOT use Prisma, Drizzle, TypeORM, Sequelize, or Mongoose. If the tool needs persistence, use direct SQL via `pg` (Postgres) or `better-sqlite3` (local), or just filesystem JSON. Reason: these ORMs require schema files and codegen steps that fail on Vercel when misconfigured.
- INTERNAL FILE DISCIPLINE: Every internal import (paths starting with `@/`, `./`, or `../`) MUST refer to a file you actually create in this build. If you write `import { Card } from "@/components/ui/card"`, then `components/ui/card.tsx` MUST exist with a real `export const Card` (or `export default Card`). Before finishing, scan all internal imports and verify every target file exists. Do NOT use shadcn/ui patterns unless you create every component from scratch — easier path: write all UI inline in the page that uses it.
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.


PREVIOUS ATTEMPT FAILED WITH:
Codex timed out after 600s
Please fix the above errors and regenerate.