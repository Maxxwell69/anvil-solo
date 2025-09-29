# --- Builder Stage ---
FROM --platform=linux/amd64 node:23-slim AS builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# --- Production Stage ---
FROM --platform=linux/amd64 node:23-slim

# Clear any existing entrypoint from base image
ENTRYPOINT []

# Set default port and environment variables
ENV PORT=8080
EXPOSE $PORT

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY src/config.json ./dist/config.json

# Use CMD instead of ENTRYPOINT for better Kubernetes compatibility
CMD ["node", "dist/index.js"]