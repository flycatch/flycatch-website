FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG PUBLIC_ORIGIN=http://localhost:8080
ARG PUBLIC_ENVIRONMENT=development
ENV PUBLIC_ORIGIN=$PUBLIC_ORIGIN
ENV PUBLIC_ENVIRONMENT=$PUBLIC_ENVIRONMENT
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
