# syntax=docker/dockerfile:1.6
# Thin wrapper so Wrangler can build from a Dockerfile path (required).
# The base image is the prebuilt Docker Hub image.
#
# Refresh the local cache when needed:
#   npm run dev:cp -- --pull
#   (or: docker pull docker.io/zintrust/zintrust:latest)

FROM docker.io/zintrust/zintrust:latest

# The base image ships with a HEALTHCHECK against port 7772.
# In Cloudflare Containers, we override the container command to run a proxy
# on 8789-8794 instead, so the base healthcheck will always fail and mark the
# container as unhealthy. Disable it here and rely on the Container DO's
# startAndWaitForPorts() readiness checks.
HEALTHCHECK NONE

# Cloudflare Containers' monitor requires the target port to be present in the
# image's exposed ports metadata.
EXPOSE 8789 8790 8791 8792 8793 8794
