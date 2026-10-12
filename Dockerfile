FROM node:20-bookworm-slim

# Set working directory
WORKDIR /app

# Install Xvfb, xauth, curl, and certificates for headless display support
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    xauth \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package descriptors
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Install Playwright Chromium browser and all required Linux system packages
RUN npx playwright install --with-deps chromium

# Copy codebase including bundled extension
COPY . .

# Compile TypeScript
RUN npm run build

# Default container environment variables
ENV HOST=0.0.0.0
ENV PORT=10000
ENV NODE_ENV=production
ENV EXTENSION_PATH=/app/extension
ENV HEADLESS=false
ENV CHROME_CHANNEL=""
ENV DISPLAY=:99

EXPOSE 10000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

# Run with virtual frame buffer daemon and direct Node process execution
CMD ["/bin/sh", "-c", "rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true; Xvfb :99 -screen 0 1280x900x16 -ac -noreset & exec node dist/cli.js --http"]
