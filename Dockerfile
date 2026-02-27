# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# Build-time env (Vite reads VITE_* at build time)
ARG VITE_MEDUSA_BACKEND_URL
ARG VITE_MEDUSA_PUBLISHABLE_KEY
ARG VITE_MEDUSA_REGION_ID
ENV VITE_MEDUSA_BACKEND_URL=$VITE_MEDUSA_BACKEND_URL
ENV VITE_MEDUSA_PUBLISHABLE_KEY=$VITE_MEDUSA_PUBLISHABLE_KEY
ENV VITE_MEDUSA_REGION_ID=$VITE_MEDUSA_REGION_ID

# Install deps
COPY package.json package-lock.json ./

# IMPORTANT:
# npm ci fails if package-lock.json is out of sync.
# Use npm install to succeed, then later regenerate lock properly.
RUN npm install --no-audit --no-fund

# Build
COPY . .
RUN npm run build

# ---- run (nginx) ----
FROM nginx:1.27-alpine AS run
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
