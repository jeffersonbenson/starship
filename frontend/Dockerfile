FROM alpine

COPY ./dist /var/www/localhost/htdocs/

RUN apk add --no-cache lighttpd && \
  rm -rf /var/cache/apk/*

EXPOSE 80
EXPOSE 443

CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
