FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --prefix apps/api

# Copy source code
COPY apps/api ./apps/api

# Build TypeScript
RUN npm run build --prefix apps/api

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "apps/api/dist/index.js"]
