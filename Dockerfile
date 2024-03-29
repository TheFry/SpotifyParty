# syntax=docker/dockerfile:1
FROM node:14
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
COPY . .
RUN npm ci
CMD ["node", "server.js"]
