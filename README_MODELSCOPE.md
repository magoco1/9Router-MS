# 9Router on ModelScope Studio

## Why this fork
ModelScope gateway may strip `Authorization` headers. This fork accepts the API key via
`x-api-key` / `x-goog-api-key` / `x-9router-key` headers or `?api_key=` / `?key=` query param.

## Deploy (Docker Studio)
- sdk_type: docker, port 0.0.0.0:7860, DATA_DIR=/mnt/workspace/9router-data
- Secrets: JWT_SECRET, INITIAL_PASSWORD, API_KEY_SECRET
- Health: GET /api/health ; Models: GET /v1/models (or /api/v1/models)
- External clients: Base URL = https://<studio-host>  (try both with and without /v1 suffix)
  Header: x-9router-key: <9router-api-key>  (instead of Authorization if stripped)

## Keep alive
`node keep-alive.mjs` pings /api/health at random 45-180s intervals.
