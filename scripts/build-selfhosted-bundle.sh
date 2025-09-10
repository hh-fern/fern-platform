#!/bin/bash


export NEXT_PUBLIC_MEILISEARCH_ORIGIN="http://localhost:7700"
export NEXT_PUBLIC_MEILISEARCH_API_KEY="fern123!"

ENV_LOCAL_PATH="packages/fern-docs/bundle/.env.local"
ENV_LOCAL_BACKUP="packages/fern-docs/bundle/.env.local.bak"

# move .env.local to a backup if it exists
if [ -f "$ENV_LOCAL_PATH" ]; then
    echo "temporarily moving .env.local to backup..."
    mv "$ENV_LOCAL_PATH" "$ENV_LOCAL_BACKUP"
fi

# run the build process
NODE_ENV=production pnpm --filter=@fern-docs/bundle docs:build:selfhosted
NODE_ENV=production pnpm --filter=@fern-docs/bundle docs:rewrite:local
NODE_ENV=production pnpm --filter=@fern-platform/cdk docs:local:zipBundle ../../../docs_bundle.tar.gz

# move .env.local back if it was backed up
if [ -f "$ENV_LOCAL_BACKUP" ]; then
    echo "restoring .env.local from backup..."
    mv "$ENV_LOCAL_BACKUP" "$ENV_LOCAL_PATH"
fi
