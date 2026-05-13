# =====================================================================
# Mawared backend — multi-stage production image.
# Final image: node:20-alpine, non-root, ~150MB.
# =====================================================================

# ---- Stage 1: deps (full deps for build) ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
# Include @mawared/shared-types explicitly so its devDeps (typescript) are installed
RUN pnpm install --frozen-lockfile=false --filter @mawared/shared-types --filter @mawared/backend...

# ---- Stage 2: build ----
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /repo/packages ./packages
COPY apps/backend ./apps/backend
COPY package.json pnpm-workspace.yaml turbo.json ./
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
# Build shared-types first — its dist/ is git-ignored so must be compiled here
RUN pnpm --filter @mawared/shared-types build
WORKDIR /repo/apps/backend
RUN pnpm prisma generate
RUN pnpm build
# Verify build produced output
RUN ls dist/main.js || (echo "ERROR: dist/main.js not found" && exit 1)

# ---- Stage 3: prod deps only ----
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN pnpm install --frozen-lockfile=false --filter @mawared/backend... --prod

# ---- Stage 4: runtime ----
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini openssl
# Prisma CLI is needed at runtime for `prisma migrate deploy` (Railway preDeploy hook).
RUN npm i -g prisma@5.22.0 && npm cache clean --force
WORKDIR /repo/apps/backend
ENV NODE_ENV=production \
    PORT=3000
COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=prod-deps /repo/apps/backend/node_modules /repo/apps/backend/node_modules
COPY --from=prod-deps /repo/packages /repo/packages
# shared-types dist is git-ignored — copy the compiled output from the build stage
COPY --from=build /repo/packages/shared-types/dist /repo/packages/shared-types/dist
COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/apps/backend/prisma ./prisma
COPY apps/backend/package.json ./package.json
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /repo
USER app
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
