FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml* ./

# Instalar todas las dependencias
RUN pnpm install --frozen-lockfile || true

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN pnpm run build || true

FROM node:20-alpine AS production
RUN npm install -g pnpm
WORKDIR /app

# Copiar dependencias y build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile || true
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
