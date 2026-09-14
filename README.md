<div align="center">

# 🚀 9Router-MS

**Run [9Router](https://github.com/decolua/9router) on free [ModelScope](https://www.modelscope.ai) Studio — one stable endpoint, automatic provider fallback.**

[![Docker](https://img.shields.io/badge/docker-7860-blue?logo=docker)](./Dockerfile)
[![ModelScope](https://img.shields.io/badge/ModelScope-Studio-purple)](https://www.modelscope.ai/studios)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Worker-orange?logo=cloudflare)](./workers/bridge-template.js)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**[🇬🇧 English](./README.md) · [🇮🇷 فارسی](./README.fa.md)**

</div>

---

## 🧭 How it works

```
┌──────────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│  Any OpenAI      │      │  Cloudflare       │      │  ModelScope Studio  │
│  chat client     │─────▶│  Worker (stable)  │─────▶│  9Router (Docker)   │
│  1 Base URL      │      │  injects gateway  │      │  aggregates YOUR    │
│  1 API key       │      │  auth automatically│     │  provider keys with │
└──────────────────┘      └───────────────────┘      │  auto-fallback      │
                                                     └─────────────────────┘
```

> **Why the Worker?** The ModelScope gateway consumes the `Authorization` header for its own
> token, so single-field clients can't reach the app directly. The Worker adds the gateway
> headers for you — clients only ever see **one Base URL + one key**.

## ✨ What this fork changes vs upstream

| # | Area | Change |
|---|------|--------|
| 1 | 🐳 Port | Listens on `0.0.0.0:7860` (ModelScope Docker requirement; upstream uses `20128`) |
| 2 | 🔑 Auth compat | App key also accepted via `x-api-key` / `x-goog-api-key` / `x-9router-key` or `?api_key=` / `?key=` (`src/sse/services/auth.js`) |
| 3 | 🌐 Tunnel from browser | Safe tunnel routes (`/api/tunnel/enable\|disable\|status`) work for JWT-logged-in users, no localhost needed (`src/dashboardGuard.js`) |
| 4 | 🔌 Tunnel port | Defaults to `process.env.PORT`, so the tunnel targets `7860` on Studio (`src/lib/tunnel/cloudflare/manager.js`) |
| 5 | 💾 Persistence | `DATA_DIR=/mnt/workspace/9router-data` (Studio's only persistent path) |
| 6 | 💓 Keep-alive | `keep-alive.mjs`: ~8–20 localhost pings per ~15h, random 30–90 min gaps + jitter, rotating endpoints & browser User-Agents |
| 7 | 🌉 Stable URL | `workers/bridge-template.js`: Cloudflare Worker template (no secrets inside) |

## 🛠️ Setup — step by step (browser only, no terminal)

### Step 1 — Create the Studio
1. Go to `modelscope.ai` → **Studios** → **Create** → type **Docker**, free hardware.
2. Push this repo to the Studio git (`master` branch) and hit **Deploy** (first Docker build takes ~3–5 min).

### Step 2 — Studio Secrets (Studio page → Secrets — never commit these!)
| Key | Value |
|-----|-------|
| `JWT_SECRET` | a long random string |
| `INITIAL_PASSWORD` | your dashboard password |
| `REQUIRE_API_KEY` | `false` |

> Changing `INITIAL_PASSWORD` later does **not** reset the password stored in the database —
> change it from inside the dashboard (Profile/Settings), or wipe `/mnt/workspace/9router-data` + redeploy.

### Step 3 — Create a 9Router API key
Dashboard → **API Keys** → New Key → copy it (looks like `sk-...`). Rotate it after testing.

### Step 4 — Open a tunnel (public, temporary URL)
Dashboard → **Tunnel** → **Enable** (click **once** — every click creates a new URL).
Verify: `GET <tunnel>/api/health` → `{"ok":true}`.

### Step 5 — Point your chat client at it
- **Via tunnel:** Base URL `<tunnel>/v1`, API Key `<9router-key>`
- ⚠️ The `*.ms.fun` Studio host does **not** serve API traffic to plain HTTP clients (gateway `403`);
  the `*.api-inference.modelscope.ai` host needs the ModelScope token in `Authorization`,
  so single-field clients **must** use the tunnel or the Worker below.

### Step 6 — Stable URL via your own Cloudflare Worker (recommended)
1. `dash.cloudflare.com` → Workers & Pages → Create Worker → paste [`workers/bridge-template.js`](./workers/bridge-template.js) → Deploy.
2. Settings → Variables and Secrets:
   - plaintext `TUNNEL_URL` = current tunnel host (no trailing slash)
   - secret `MS_TOKEN` = your ModelScope access token (fallback only — never in code)
3. Clients use (forever stable): Base URL `https://<your-worker>.<subdomain>.workers.dev/v1`, API Key `<9router-key>`.
4. When the tunnel host changes, only update `TUNNEL_URL`. Rotate tokens when done testing.

### Step 7 — Add your provider keys
Dashboard → Providers → add each provider API key. 9Router auto-switches on rate limits —
that is the whole point: many limited keys in, one unlimited-feeling endpoint out.

## 🔒 Security notes
- No real tokens/passwords live in this repo (only placeholders in `.env.example`).
- Real values live only in Studio Secrets and Worker Secrets — safe even though the Studio is public.
- This setup keeps a free Studio awake with low-frequency human-like pings; circumventing
  platform sleep policies may violate the ToS and risks a ban — your responsibility.

## 📁 Key files
- `Dockerfile` — ModelScope-ready image (port `7860`, persistent data dir)
- `Dockerfile.modelscope` — reference copy · `keep-alive.mjs` — human-like keep-alive
- `workers/bridge-template.js` — stable-URL Worker (bring your own tokens)
- `README.fa.md` — راهنمای فارسی · `README_UPSTREAM.md` — original 9Router readme
