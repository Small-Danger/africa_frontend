# Vite 7 exige Node.js >= 20.19
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=optional

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g serve@14

COPY --from=build /app/dist ./dist

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
