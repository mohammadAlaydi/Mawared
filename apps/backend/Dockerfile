# =====================================================================
# Mawared backend — multi-stage production image.
# Final image: node:20-alpine, non-root.
# =====================================================================

# ---- Stage 1: deps (full deps for build) ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
# Skip puppeteer download — not needed for building, saves ~200MB + minutes.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile=false --filter @mawared/shared-types --filter @mawared/backend...

# ---- Stage 2: build ----
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /repo/packages ./packages
# Copy source LAST — any source change invalidates only the steps below.
COPY apps/backend ./apps/backend
COPY package.json pnpm-workspace.yaml turbo.json ./
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
# Build shared-types first — its dist/ is git-ignored so must be compiled here
RUN pnpm --filter @mawared/shared-types build
WORKDIR /repo/apps/backend
RUN pnpm prisma generate
# Run nest build via npx to avoid pnpm workspace script resolution issues.
# The tsconfig sets outDir="./dist" and rootDir="./src".
RUN npx nest build \
    && test -f dist/main.js || (echo "FATAL: dist/main.js missing after build" && exit 1)

# ---- Stage 3: prod deps only ----
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile=false --filter @mawared/backend... --prod

# ---- Stage 4: runtime ----
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini openssl
# Prisma CLI for `prisma migrate deploy` in Railway preDeploy hook.
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
