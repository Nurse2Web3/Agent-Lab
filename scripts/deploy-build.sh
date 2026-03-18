#!/bin/bash
set -e

echo "==> Building API client library..."
pnpm --filter @workspace/api-client-react run build 2>/dev/null || true
pnpm --filter @workspace/db run build 2>/dev/null || true

echo "==> Building frontend..."
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/agentlab run build

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Build complete."
