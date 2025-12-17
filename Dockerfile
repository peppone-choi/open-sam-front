# ==========================================
# Multi-stage build for OpenSAM Frontend
# ==========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# ==========================================
# Stage 2: Builder
# ==========================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ==========================================
# Stage 3: Runtime
# ==========================================

FROM node:20-alpine AS runtime

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start Next.js
CMD ["node", "server.js"]
