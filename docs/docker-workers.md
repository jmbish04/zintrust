# Docker Workers

ZinTrust ships a single monolith Docker image for the app runtime and worker/scheduler processes.

## Image

- Runtime image: `zintrust/zintrust`

## Quick start

### Workers stack

```bash
docker compose -f docker-compose.workers.yml up -d
```

### Schedules stack

```bash
docker compose -f docker-compose.schedules.yml up -d
```

## Pin a version

```bash
ZINTRUST_IMAGE=zintrust/zintrust:<version> docker compose -f docker-compose.workers.yml up -d
ZINTRUST_IMAGE=zintrust/zintrust:<version> docker compose -f docker-compose.schedules.yml up -d
```

## Publishing images (maintainers)

```bash
zin docker push --tag <version>
```

Common options:

- `--platforms linux/amd64,linux/arm64`
- `--no-also-latest`
- `--only runtime|gateway|both`
