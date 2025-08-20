# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json tsconfig.base.json ./
COPY server/package.json server/tsconfig.json server/ ./server/
COPY shared/package.json shared/tsconfig.json shared/ ./shared/
RUN npm install --workspaces --no-audit --no-fund

# Build
COPY . .
RUN npm run build

# Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/server/package.json ./server/package.json
COPY --from=base /app/node_modules ./node_modules
EXPOSE 8080
CMD ["node", "server/dist/index.js"]