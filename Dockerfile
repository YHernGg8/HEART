# ─── HEART: Cloud Run Dockerfile ───
# Builds the Vite frontend, then runs the Express backend which serves both API + static files

# Stage 1: Build frontend
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

# Stage 2: Production server
FROM node:20-slim AS production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy backend source + configs
COPY src/ai ./src/ai
COPY key.json ./key.json
COPY .env ./.env

# Expose Cloud Run port (set via PORT env)
EXPOSE 8080

# Cloud Run sets PORT=8080 by default
ENV NODE_ENV=production
ENV PORT=8080

# Start the Express server (tsx handles TypeScript directly)
CMD ["npx", "tsx", "src/ai/server.ts"]
