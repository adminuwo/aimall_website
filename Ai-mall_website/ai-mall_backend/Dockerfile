# --- DEPENDENCIES ---
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# --- RUNTIME ---
FROM node:18-alpine
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Cloud Run defaults to PORT 8080 if not specified otherwise
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
