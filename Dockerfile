FROM node:20-alpine AS build
WORKDIR /app

# Прод: BASE_PATH=/admin/ VITE_API_URL=/api/v1
# Тест: BASE_PATH=/plt/admin/ VITE_API_URL=/plt/api/v1
ARG BASE_PATH=/admin/
ARG VITE_API_URL=/api/v1
ENV BASE_PATH=$BASE_PATH
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

ARG BASE_PATH=/admin/
ENV BASE_PATH=$BASE_PATH

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
