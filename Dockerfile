# Deferred: not part of any gate yet. Build client + server, serve both from one Node process.
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY config/package.json config/
COPY client/package.json client/
COPY server/package.json server/
RUN apk add --no-cache python3 make g++
RUN pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm -r build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data PORT=8080
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/node_modules/.pnpm/better-sqlite3*/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=build /app/node_modules/.pnpm/bindings*/node_modules/bindings ./node_modules/bindings
COPY --from=build /app/node_modules/.pnpm/file-uri-to-path*/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://localhost:8080/api/health || exit 1
CMD ["node", "server/dist/index.js"]
