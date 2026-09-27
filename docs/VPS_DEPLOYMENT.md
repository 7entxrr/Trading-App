# Deploying to the Windows AWS EC2 VPS

This moves the pipeline you already have working locally —
`MT5 → GoldMinerMonitor.mq5 → backend → dashboard` — onto the VPS so it runs
24/7 without this laptop. Nothing about the pipeline changes: the VPS just
becomes the machine that runs MT5, the backend, and (optionally) the
dashboard itself.

Do this from an RDP session into the VPS (Start Menu → Remote Desktop
Connection, or the AWS Console's "Connect" button once you have RDP set up).
None of this needs your broker password to be given to anyone but MT5 itself.

## 1. Install prerequisites on the VPS

- **MetaTrader 5** — install the same terminal/broker build you use locally,
  log into your account there (only you do this, directly in MT5's own login
  dialog — never anywhere else).
- **Node.js LTS** (v20+) — from nodejs.org. Needed for the backend; the
  dashboard is optional to also host on the VPS (see step 5).
- **Git** (optional) — easiest way to get this repo onto the VPS is
  `git clone` your remote, or simply copy the folder over RDP (copy on your
  laptop → paste into the RDP window).

## 2. Install GoldMinerMonitor

Same as local: copy [`../mt5-bridge/GoldMinerMonitor.mq5`](../mt5-bridge/GoldMinerMonitor.mq5)
into `MQL5/Experts/` in the VPS terminal's data folder (File → Open Data
Folder), compile it in MetaEditor, attach it to a chart, tick **Allow Algo
Trading**. Full detail in [`../mt5-bridge/README.md`](../mt5-bridge/README.md).

## 3. Run the backend on the VPS

```powershell
cd C:\path\to\trade-dashboard\backend
copy .env.example .env
notepad .env
```

Set in `.env`:
- `SNAPSHOT_DIR` — the VPS's own `%APPDATA%\MetaQuotes\Terminal\Common\Files`
  (same relative path as your laptop, different absolute path since the
  Windows username differs).
- `API_KEY` — **set this to a long random value now.** The backend will be
  reachable from the internet; without a key, anyone who finds the port can
  read your balances. Generate one with
  `powershell -Command "[guid]::NewGuid().ToString()"`.
- `CORS_ORIGIN` — the exact origin your dashboard will be served from once
  you know it (e.g. `https://goldminer.yourdomain.com`). `*` still works (it
  reflects the caller's origin) but a named origin is tighter.

Run it as a proper Windows service so it survives reboots/logouts, using
[NSSM](https://nssm.cc/download):

```powershell
nssm install GoldMinerBackend "C:\Program Files\nodejs\node.exe" "C:\path\to\trade-dashboard\backend\server.js"
nssm set GoldMinerBackend AppDirectory "C:\path\to\trade-dashboard\backend"
nssm set GoldMinerBackend Start SERVICE_AUTO_START
nssm start GoldMinerBackend
```

Confirm it's up: `curl http://localhost:4000/system/status` from the VPS
itself should return `{"apiConnected":true,...}`.

## 4. Open the firewall for the backend port

Only if the dashboard will run *outside* the VPS (e.g. on Vercel, or you're
hosting it elsewhere) do you need the backend port reachable from the
internet at all:

```powershell
New-NetFirewallRule -DisplayName "GoldMiner Backend" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
```

Then in the AWS EC2 console, open the same port in the instance's Security
Group (inbound rule, TCP 4000, source = wherever the dashboard is hosted, or
0.0.0.0/0 if you don't know it yet — tighten this once you do).

**Put HTTPS in front of it before using it from a phone browser** — plain
HTTP will trip mixed-content blocking if your dashboard itself is HTTPS
(and PWAs generally require HTTPS to install). The simplest option is
[Caddy](https://caddyserver.com/) — a single binary, no dependency, that
gets a free Let's Encrypt certificate automatically for a real domain
pointed at the VPS:

```powershell
# after pointing a DNS A record at the VPS's public IP, e.g. api.yourdomain.com
caddy reverse-proxy --from api.yourdomain.com --to localhost:4000
```

Run that as a service too (NSSM again, or Caddy's own Windows service mode)
so it survives reboots.

## 5. Run the dashboard

Two options:

**A. Host the dashboard on the VPS too** (simplest, keeps everything on one
machine):

```powershell
cd C:\path\to\trade-dashboard
copy .env.example .env.local
notepad .env.local
```

Set `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com` (the Caddy URL from
step 4) and `NEXT_PUBLIC_API_KEY` to the same value as the backend's
`API_KEY`. Then:

```powershell
npm install
npm run build
npm start
```

Put this behind Caddy too (a second `reverse-proxy` block, or a Caddyfile
with two site blocks) on its own domain, e.g. `goldminer.yourdomain.com`.
Run `npm start` as an NSSM service the same way as the backend.

**B. Host the dashboard elsewhere** (e.g. Vercel) and just point
`NEXT_PUBLIC_API_BASE_URL` at the VPS's backend URL from step 4. Nothing else
changes — the dashboard never needs to run on the same machine as MT5.

## 6. Verify

From your phone or laptop, open the dashboard's URL and confirm:
- The header shows **API CONNECTED**, not offline.
- Home shows your real balance/equity (not zero, unless the account really
  is empty).
- `GET https://api.yourdomain.com/system/status` (with your API key header)
  returns `mt5AgentConnected: true`.

If MT5, GoldMiner, or GoldMinerMonitor stop running on the VPS, the
dashboard will show a stale/offline state rather than freezing on old
numbers — that's the read-only guarantee working as intended, not a bug.
