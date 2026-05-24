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

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force


COPY --from=builder /app/dist ./dist


RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 \
    && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 8080

CMD ["node", "dist/main"]
