FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && \
    test -f dist/main.js || \
    (echo "Error: La compilación no generó dist/main.js" && exit 1)

FROM node:24-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 \
    && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/main"]
