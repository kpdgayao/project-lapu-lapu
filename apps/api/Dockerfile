FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (use npm ci for reproducible builds)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (Railway sets PORT env var)
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
