FROM nginx:1.27.5-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.dev /etc/nginx/nginx.conf.template

COPY ./env.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh
# Update all environment variables
CMD ["/docker-entrypoint.sh"]