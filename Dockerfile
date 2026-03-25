# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app

# Vite bakes these into the bundle at build time — must be passed as build args
ARG VITE_MEDUSA_BACKEND_URL
ARG VITE_MEDUSA_PUBLISHABLE_KEY
ARG VITE_MEDUSA_REGION_ID
ARG VITE_MERCADOPAGO_PUBLIC_KEY

ENV VITE_MEDUSA_BACKEND_URL=$VITE_MEDUSA_BACKEND_URL
ENV VITE_MEDUSA_PUBLISHABLE_KEY=$VITE_MEDUSA_PUBLISHABLE_KEY
ENV VITE_MEDUSA_REGION_ID=$VITE_MEDUSA_REGION_ID
ENV VITE_MERCADOPAGO_PUBLIC_KEY=$VITE_MERCADOPAGO_PUBLIC_KEY

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ── Stage 2: Serve (nginx) ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS run

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
