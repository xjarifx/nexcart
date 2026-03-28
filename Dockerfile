# Build stage
FROM node:24-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Standard env for Prisma 7 config validation (dummy URL for build)
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:1/dummy

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:24-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install production dependencies only
RUN npm ci --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

# We use a shell script or a multi-command here to handle Prisma migrations
# But for simplicity, we provide a start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
