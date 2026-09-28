# Deploying the dashboard on the VPS

Runs as a separate container (`goldminer-dashboard`) behind the existing
Traefik. It never touches the `goldminer-api` or MT5 containers.

```bash
# 1. Get the code
cd /opt
git clone -b claude/elegant-euler-3zctea https://github.com/7entxrr/Trading-App.git goldminer-dashboard
cd goldminer-dashboard/deploy

# 2. Secrets (never commit this file)
TOKEN=$(grep '^API_TOKEN=' /opt/goldminer-api/.env | cut -d= -f2-)
cat > dashboard.env <<ENV
GOLDMINER_API_TOKEN=$TOKEN
GOLDMINER_APP_PASSCODE=choose-a-long-passcode-here
GOLDMINER_ENABLE_TRADING=false
ENV
chmod 600 dashboard.env

# 3. Traefik settings (check your existing goldminer-api labels for the right names)
docker inspect goldminer-api --format '{{json .Config.Labels}}' | tr ',' '\n' | grep -i traefik
docker network ls | grep -i traefik
export DASHBOARD_DOMAIN=app.srv1995263.hstgr.cloud   # DNS must point at this VPS
export TRAEFIK_NETWORK=traefik                        # from `docker network ls`
export CERT_RESOLVER=letsencrypt                      # from the api's labels

# 4. Build and start
docker compose up -d --build
docker logs -f goldminer-dashboard     # wait for "Ready"
```

Open `https://$DASHBOARD_DOMAIN` and unlock with your passcode.

- Update later: `git pull && docker compose up -d --build`
- Stop: `docker compose down` (only stops the dashboard)
- Enable trading only after your own 0.01-lot test: set
  `GOLDMINER_ENABLE_TRADING=true` in `dashboard.env`, then `docker compose up -d`.
