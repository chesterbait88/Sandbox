# Single image: build the client and server, then serve both from one Node process on 8080.
# Not exercised in the build sandbox (no Docker daemon); `pnpm build && pnpm start` runs the same thing.
FROM node:20-alpine AS build
RUN corepack enable && apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY config/package.json config/
COPY client/package.json client/
COPY server/package.json server/
RUN pnpm install
COPY . .
RUN pnpm -r build && pnpm --filter @vw/server deploy --prod /app/deploy

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data PORT=8080
COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/api/health || exit 1
CMD ["node", "server/dist/index.js"]
