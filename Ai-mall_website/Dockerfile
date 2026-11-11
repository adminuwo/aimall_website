# --- STAGE 1: Build Frontend Assets ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/ai-mall_frontend
COPY ai-mall_frontend/package*.json ./
RUN npm install
COPY ai-mall_frontend ./
RUN npm run build

# --- STAGE 2: Prepare Backend Dependencies ---
FROM node:18-alpine AS backend-deps
WORKDIR /app/ai-mall_backend
COPY ai-mall_backend/package*.json ./
RUN npm install --omit=dev

# --- STAGE 3: Final Unified Production Container ---
FROM node:18-alpine AS production
WORKDIR /app/ai-mall_backend

# Copy backend dependencies and source code
COPY --from=backend-deps /app/ai-mall_backend/node_modules ./node_modules
COPY ai-mall_backend ./

# Copy built frontend dist and fallback files
COPY --from=frontend-builder /app/ai-mall_frontend/dist /app/ai-mall_frontend/dist
COPY --from=frontend-builder /app/ai-mall_frontend /app/ai-mall_frontend

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
