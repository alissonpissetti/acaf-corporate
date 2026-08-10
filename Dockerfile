# acaf-corporate — Vite SPA + nginx (Coolify)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# Coolify define NODE_ENV=production no build; sem isso npm ci não instala vite.
RUN npm ci --include=dev

COPY . .

# Vazio em produção: runtime via api-config.js ou proxy nginx /api.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine AS runner

RUN apk add --no-cache wget tzdata \
  && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
  && echo "America/Sao_Paulo" > /etc/timezone \
  && rm -f /etc/nginx/conf.d/default.conf

ENV TZ=America/Sao_Paulo
ENV PORT=80
# URL da acaf-api (Coolify: porta 80, sem :8787). Dev local: http://127.0.0.1:8787
ENV API_BACKEND_URL=http://127.0.0.1:8787

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/10-default-env.sh /docker-entrypoint.d/10-default-env.sh
COPY docker-entrypoint.d/15-api-config.sh /docker-entrypoint.d/15-api-config.sh

RUN chmod +x /docker-entrypoint.d/10-default-env.sh /docker-entrypoint.d/15-api-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD sh -c 'wget -q -O /dev/null "http://127.0.0.1:${PORT:-80}/api/health" || exit 1'

CMD ["nginx", "-g", "daemon off;"]
