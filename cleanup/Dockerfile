# syntax=docker/dockerfile:1

# ---- Base image ----
    FROM node:20-alpine AS base
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Speed up installs & keep image small
    RUN apk add --no-cache tini ca-certificates
    
    # ---- Dependencies layer ----
    FROM base AS deps
    COPY package.json package-lock.json* ./
    # Use npm ci for reproducible, clean installs (prod only)
    RUN npm ci --omit=dev
    
    # ---- Runtime image ----
    FROM base AS runner
    # Create non-root user (node user already exists on node:alpine)
    USER node
    WORKDIR /app
    
    # Copy only what you need at runtime
    COPY --chown=node:node --from=deps /app/node_modules ./node_modules
    COPY --chown=node:node ./index.js ./index.js
    COPY --chown=node:node package.json ./
    
    # Tini helps proper signal handling (graceful stop)
    ENTRYPOINT ["/sbin/tini", "--"]
    
    # Run the script we copied to /app/index.js
    CMD ["node", "index.js"]
    