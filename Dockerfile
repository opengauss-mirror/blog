FROM swr.cn-north-4.myhuaweicloud.com/opensourceway/node:latest as Builder

RUN mkdir -p /home/opengauss/web
WORKDIR /home/opengauss/web
COPY . /home/opengauss/web

RUN npm install pnpm -g
RUN pnpm install
RUN pnpm build

FROM swr.cn-north-4.myhuaweicloud.com/opensourceway/openeuler/nginx:latest as NginxBuilder

COPY --from=Builder /home/opengauss/web/app/.vitepress/dist /usr/share/nginx/html/

RUN chmod -R 755 /usr/share/nginx/html
COPY ./deploy/nginx/nginx.conf /etc/nginx/nginx.conf

RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /var/run/nginx.pid \
    && chown -R nginx:nginx /etc/nginx

EXPOSE 8080

USER nginx

ENTRYPOINT ["nginx", "-g", "daemon off;"]

