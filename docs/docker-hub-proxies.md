# Docker Hub: Prebuilt Proxy Images

ZinTrust publishes **prebuilt** Docker images for the proxy stack so developers can run the gateway + proxies **without building anything locally**.

This uses the Docker Compose stack defined in `docker-compose.proxy.yml`.

## Images

- Proxy runtime image: `zintrust/zintrust-proxy`
- Gateway image: `zintrust/zintrust-proxy-gateway`

`docker-compose.proxy.yml` defaults to the `:latest` tags for both. You only need to set `PROXY_IMAGE` / `PROXY_GATEWAY_IMAGE` if you want to pin a different tag.

## Quick start

### 1) Get the compose file

In a ZinTrust project repo, you already have `docker-compose.proxy.yml`.

If you’re using the proxies from another repo, copy `docker-compose.proxy.yml` into your project.

### 2) Create a compose env file

Create a file like `.env.proxy`:

```dotenv
# Required (used for signing defaults)
APP_NAME=ZinTrust
APP_KEY=change-me-to-a-long-random-string

# Optional: image pull policy
PROXY_PULL_POLICY=if_not_present

# Images (optional overrides; compose already defaults to these)
# PROXY_IMAGE=zintrust/zintrust-proxy:latest
# PROXY_GATEWAY_IMAGE=zintrust/zintrust-proxy-gateway:latest

# Where the proxies should reach your databases from inside Docker
# macOS/Windows: host.docker.internal works
# Linux: use your host IP or the docker bridge gateway (often 172.17.0.1)
DOCKER_DB_HOST=host.docker.internal
DOCKER_REDIS_HOST=host.docker.internal

# MySQL target DB (adjust to your setup)
DB_PORT=3306
DB_DATABASE=zintrust
DB_USERNAME=root
DB_PASSWORD=secret

# Postgres target DB (if you use it)
POSTGRES_DB_PORT=5432
POSTGRES_DB_DATABASE=postgres
POSTGRES_DB_USERNAME=postgres
POSTGRES_DB_PASSWORD=postgres

# SQL Server target DB (if you use it)
SQLSERVER_DB_HOST=host.docker.internal
SQLSERVER_DB_PORT=1433
SQLSERVER_DB_DATABASE=zintrust
SQLSERVER_DB_USERNAME=sa
SQLSERVER_DB_PASSWORD=secret

# SMTP proxy needs real SMTP creds if you plan to send mail
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SECURE=false
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_FROM_NAME=ZinTrust
```

### 3) Start the stack

```bash
docker compose --env-file .env.proxy -f docker-compose.proxy.yml up -d
```

Gateway default port is `8800`.

### 4) Point your app at the gateway

In your app `.env`:

```dotenv
USE_MYSQL_PROXY=true
MYSQL_PROXY_URL=http://127.0.0.1:8800/mysql

USE_POSTGRES_PROXY=true
POSTGRES_PROXY_URL=http://127.0.0.1:8800/postgres

USE_REDIS_PROXY=true
REDIS_PROXY_URL=http://127.0.0.1:8800/redis

USE_SQLSERVER_PROXY=true
SQLSERVER_PROXY_URL=http://127.0.0.1:8800/sqlserver

USE_SMTP_PROXY=true
SMTP_PROXY_URL=http://127.0.0.1:8800/smtp
```

## Signing: minimum required

By default, the proxy services require request signing.

If you don’t set `*_PROXY_KEY_ID` and `*_PROXY_SECRET`, they fall back to:

- key id = `APP_NAME`
- secret = `APP_KEY`

So for local/dev, the minimum is: set a non-empty `APP_KEY`.

## Troubleshooting

- **pull access denied for `zintrust/zintrust-proxy`**: the image isn’t published yet, the repo is private, or you’re not logged in.
  - If it’s public: run `docker login` (sometimes still required due to rate limits) and retry.
  - If it’s private/unpublished: build locally and override `PROXY_IMAGE` / `PROXY_GATEWAY_IMAGE`.

- **Proxy health is UNHEALTHY / connection refused**: your DB host is wrong _from inside Docker_.
  - macOS/Windows: use `host.docker.internal`
  - Linux: use your host IP or `172.17.0.1` (varies by setup)

- **Disable healthchecks** (rarely needed):

```dotenv
PROXY_HEALTHCHECK_DISABLE=true
PROXY_GATEWAY_HEALTHCHECK_DISABLE=true
```
