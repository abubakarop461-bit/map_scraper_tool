FROM node:20-bookworm-slim

# Set working directory
WORKDIR /app

# Install Xvfb, xauth, curl, and certificates for headless virtual display support
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
ENV CHROME_CHANNEL="chromium"
ENV DISPLAY=:99
ENV NODE_OPTIONS="--max-old-space-size=128"

EXPOSE 10000

# Run with virtual frame buffer daemon (16-bit depth uses minimal RAM) and direct Node process execution
CMD ["/bin/sh", "-c", "rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true; Xvfb :99 -screen 0 1024x768x16 -ac -noreset & exec node dist/cli.js --http"]
