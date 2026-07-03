---
name: run-inversiones-tracker
description: Launch inversiones-tracker's dev server and drive it with a headless browser to see a change rendered for real — login, screenshot, cleanup. Use whenever a change needs visual verification, not just a passing build.
---

# Running inversiones-tracker

This is a Next.js 16 app on Windows/git-bash with no browser tool built in and no `chromium-cli` installed. "Running" it means: dev server up, headless Chromium via Playwright driving it, screenshot proving the page rendered with real data.

## Dev server

```bash
cd "c:\Users\alons.PCALONSO\OneDrive\Escritorio\inversiones-tracker"
(nohup npm run dev > /tmp/dev-server.log 2>&1 & echo $! > /tmp/dev.pid)
timeout 30 bash -c 'until curl -sf http://localhost:3000/login >/dev/null; do sleep 1; done' && echo UP
```

**Stop it** — `pkill`/`kill` don't exist in this git-bash environment. Find the PID by port and use Windows `taskkill`:

```bash
netstat -ano | grep ":3000" | grep LISTENING   # last column is the PID
taskkill //PID <pid> //T //F
```

## Playwright (not a project dependency — install per session, remove after)

`chromium-cli` isn't available here. No project `package.json` dependency on `playwright` either — don't add one permanently just to look at a screenshot.

```bash
npm install --no-save playwright        # --no-save: never touches package.json/lock
npx playwright install chromium          # only needed once per machine; caches under
                                          # ~/AppData/Local/ms-playwright — skip if already there
```

**Gotcha:** write the driver script *inside the project directory* (e.g. `./visual_check.mjs`), not in an external scratch/temp path. Node's ESM resolver looks for `node_modules` next to the importing file — a script outside the repo can't `import { chromium } from "playwright"` even though the package is installed in the repo's `node_modules`.

When done: `rm` the driver script(s) and `npm uninstall playwright`, then `git status --short` to confirm the working tree is clean (nothing should show — `--no-save` means package.json/lock never changed).

## Auth

The dev server's `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`) points at the **same Supabase project as production** — there is no separate local/dev database. Never invent test data that could collide with the real user's actual accounts (e.g. reusing their real account names) and always clean up.

1. Get the `service_role` key (needed only for the two admin calls below, never used from the browser):
   ```bash
   npx supabase projects api-keys --project-ref worxgqtsmvpcqddhenzm
   ```
   (requires the Supabase CLI already logged in and linked — it is, for this project).

2. External HTTPS calls (Supabase Admin/REST API) get intercepted by a context-mode hook if run via `curl`/`Bash` in this environment — use `mcp__plugin_context-mode_context-mode__ctx_execute` (language: javascript, plain `fetch`) instead.

3. Create a disposable test user + minimal account, entirely via `ctx_execute`:
   ```js
   const URL = "https://worxgqtsmvpcqddhenzm.supabase.co";
   const SERVICE = "<service_role key from step 1>";
   const email = "demo_visual@example.com", password = "SomeStrongPass123!";

   const user = await fetch(`${URL}/auth/v1/admin/users`, {
     method: "POST",
     headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
     body: JSON.stringify({ email, password, email_confirm: true }),
   }).then(r => r.json());

   const [cuenta] = await fetch(`${URL}/rest/v1/cuentas`, {
     method: "POST",
     headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", Prefer: "return=representation" },
     body: JSON.stringify([{ user_id: user.id, nombre: "Cuenta demo", plataforma: "test", tipo: "otro", moneda: "CLP" }]),
   }).then(r => r.json());

   await fetch(`${URL}/rest/v1/snapshots`, {
     method: "POST",
     headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
     body: JSON.stringify([{ cuenta_id: cuenta.id, fecha: new Date().toISOString().slice(0, 10), valor: 1000000 }]),
   });
   console.log(JSON.stringify({ userId: user.id, cuentaId: cuenta.id }));
   ```

4. Log in through the real `/login` form (selectors are stable — `src/app/login/page.tsx`):
   `input[name="email"]`, `input[name="password"]`, `button[type="submit"]`.

5. **Always clean up afterward**, scoped by `user_id` (never by account name — a test account could coincidentally share a display name with the user's real data):
   ```js
   await fetch(`${URL}/rest/v1/cuentas?user_id=eq.${userId}`, { method: "DELETE", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
   await fetch(`${URL}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
   ```

## Drive

```js
// ./visual_check.mjs — run from inside the project dir: node visual_check.mjs
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const consoleErrors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 1400 } }); // app is single-column, mobile-first
page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "demo_visual@example.com");
await page.fill('input[name="password"]', "SomeStrongPass123!");
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`, { timeout: 15000 });
await page.waitForSelector("text=Mi portafolio");
await page.screenshot({ path: "./screenshot.png", fullPage: true });

console.log("console errors:", JSON.stringify(consoleErrors));
await browser.close();
```

Then `Read` the resulting PNG — a screenshot you don't look at proves nothing.

## App-specific gotchas

- **`window.confirm()` dialogs** (e.g. "dar de baja esta cuenta" in `EditarCuentaForm.tsx`) hang the click forever unless handled first: `page.on("dialog", async (d) => { await d.accept(); })`.
- **React controlled inputs**: use Playwright's `fill`/`type`, never `eval el.value = '…'` — it won't fire React's `onChange`.
- **Viewport**: the whole UI is single-column/mobile-first (`max-w-sm`/`max-w-2xl` containers) — a narrow viewport (~480px) matches real usage better than a wide desktop one.
- **Next.js dev overlay**: in `npm run dev` (never in `next build`) a floating circular "N" button appears bottom-left — that's the framework's dev toolbar, not an app bug. Don't mistake it for a rendering issue.
- **`server` vs `client` components**: most of the app is server components receiving pre-computed props (`PortfolioSummary`, `CapitalSummary`, `PlatformBreakdown`, `MarketBenchmark`, `AccountRow`) — only the interactive forms (`CuentaForm`, `SnapshotForm`, `HistorialForm`, `EditarCuentaForm`) are `"use client"`. If a screenshot looks stale after an edit, it's almost always a server-side data/query issue, not a hydration one.
