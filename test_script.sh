#!/bin/bash
# 1. Stack & Frameworks
# - Runtime: Cloudflare Workers (Hono framework).
echo "=== Hono Framework ==="
grep -rn "hono" package.json src/ || echo "Hono not found"
echo ""

# - Database: Drizzle ORM with D1 (SQLite). ID columns must be `integer('id').primaryKey({ autoIncrement: true })`.
echo "=== Drizzle ORM ==="
grep -rn "drizzle" package.json src/ || echo "Drizzle not found"
echo ""

# - AI: Google Gemini via `@google/genai` or Workers AI fallback.
echo "=== AI (Gemini/Workers AI) ==="
grep -rn "@google/genai" package.json src/ || echo "Google GenAI not found"
grep -rn "ai" src/ | grep -i "cloudflare" || echo "Workers AI not found"
echo ""

# - Agents: `@cloudflare/agents` SDK for stateful, long-running processes.
echo "=== Cloudflare Agents ==="
grep -rn "@cloudflare/agents" package.json src/ || echo "Cloudflare Agents not found"
echo ""

# 2. Code Patterns
# - Strict TypeScript: No `any` unless absolutely necessary (and casted).
echo "=== TypeScript any usage ==="
grep -rn " any" src/ | wc -l || echo "0"
echo ""

# - OpenAPI: All routes must use `@hono/zod-openapi` and be fully typed.
echo "=== hono/zod-openapi ==="
grep -rn "@hono/zod-openapi" package.json src/ || echo "@hono/zod-openapi not found"
echo ""

# - Directory Structure:
#     - `src/routes/api/` for endpoints.
#     - `src/db/schemas/` for Drizzle schemas.
#     - `src/agents/` for Durable Objects/Agents.
echo "=== Directory Structure ==="
ls -d src/routes/api/ 2>/dev/null || echo "src/routes/api/ not found"
ls -d src/db/schemas/ 2>/dev/null || echo "src/db/schemas/ not found"
ls -d src/agents/ 2>/dev/null || echo "src/agents/ not found"
echo ""

# 3. Jules & Automation
# - Agent Scheduling: Use `this.schedule()` for background tasks.
echo "=== Agent Scheduling ==="
grep -rn "this.schedule()" src/ || echo "this.schedule() not found"
echo ""

# - Octokit: Use the pre-configured instance.
echo "=== Octokit ==="
grep -rn "octokit" package.json src/ || echo "Octokit not found"
echo ""

# - Webhooks: Validated via `webhook-handler.ts`.
echo "=== Webhook Handler ==="
find src -name "webhook-handler.ts" || echo "webhook-handler.ts not found"
