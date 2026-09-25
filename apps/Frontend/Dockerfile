FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG PUBLIC_ORIGIN=http://localhost:8080
ARG PUBLIC_ENVIRONMENT=development
ARG PUBLIC_RECAPTCHA_SITE_KEY=
ENV PUBLIC_ORIGIN=$PUBLIC_ORIGIN
ENV PUBLIC_ENVIRONMENT=$PUBLIC_ENVIRONMENT
ENV PUBLIC_RECAPTCHA_SITE_KEY=$PUBLIC_RECAPTCHA_SITE_KEY
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
ARG PUBLIC_RECAPTCHA_SITE_KEY=
ENV HOST=0.0.0.0
ENV PORT=4321
ENV PUBLIC_RECAPTCHA_SITE_KEY=$PUBLIC_RECAPTCHA_SITE_KEY
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
