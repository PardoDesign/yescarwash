# Statische YES CARWASH-site serveren via nginx (Coolify staging, zelfde
# patroon als de yesfit-site).
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
EXPOSE 80
