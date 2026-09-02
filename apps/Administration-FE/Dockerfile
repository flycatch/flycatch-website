FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY --from=specs . /specs
ENV CONTRACTS_DIR=/specs/002-auth-rbac/contracts
ARG PUBLIC_ORIGIN=http://localhost:8080
ARG PUBLIC_ENVIRONMENT=development
ENV PUBLIC_ORIGIN=$PUBLIC_ORIGIN
ENV PUBLIC_ENVIRONMENT=$PUBLIC_ENVIRONMENT
RUN npm run generate:client && npm run build

FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["serve", "dist", "-l", "tcp://0.0.0.0:4173", "--no-clipboard", "--no-port-switching"]
