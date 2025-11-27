FROM node:20-alpine AS builder

RUN npm install -g pnpm
WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./
COPY ..\packages\shared ./packages/shared
RUN pnpm install --frozen-lockfile || true
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm run build || true

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
