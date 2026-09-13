FROM node:22-alpine AS build
WORKDIR /repo/apps/Frontend
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY apps/Frontend/package.json apps/Frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY apps/Frontend ./
COPY openspec /repo/openspec
ARG PUBLIC_ORIGIN=http://localhost:8080
ARG PUBLIC_ENVIRONMENT=development
ARG API_ORIGIN=
ENV PUBLIC_ORIGIN=$PUBLIC_ORIGIN
ENV PUBLIC_ENVIRONMENT=$PUBLIC_ENVIRONMENT
ENV API_ORIGIN=$API_ORIGIN
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /repo/apps/Frontend/node_modules ./node_modules
COPY --from=build /repo/apps/Frontend/package.json ./
COPY --from=build /repo/apps/Frontend/dist ./dist
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
