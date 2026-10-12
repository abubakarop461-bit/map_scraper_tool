FROM node:20-bookworm-slim

# Set working directory
WORKDIR /app

# Install curl and ca-certificates for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
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
ENV HEADLESS=true
ENV CHROME_CHANNEL="chromium"
ENV NODE_OPTIONS="--max-old-space-size=200"

EXPOSE 10000

# Direct Node process execution in pure headless mode
CMD ["node", "dist/cli.js", "--http"]
