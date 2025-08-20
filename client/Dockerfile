# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY client/package.json client/tsconfig.json client/ ./client/
RUN npm install --workspaces --no-audit --no-fund
COPY . .
EXPOSE 5173
CMD ["npm", "-w", "client", "run", "dev", "--", "--host"]