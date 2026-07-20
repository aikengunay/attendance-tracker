# Classroom image: Next.js standalone + Prisma SQLite (better-sqlite3)
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/dev.db"
RUN mkdir -p /app/data \
  && npx prisma generate \
  && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/dev.db"

RUN mkdir -p /app/data \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/lib/generated ./lib/generated
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.cursor/references/complete-attendance-tracker ./.cursor/references/complete-attendance-tracker
COPY --from=builder /app/node_modules/exceljs ./node_modules/exceljs
COPY docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh \
  && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
