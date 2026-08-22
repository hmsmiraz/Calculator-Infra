FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001 -G nodejs
USER nodeuser

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/index.js"]
