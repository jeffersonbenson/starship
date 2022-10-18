FROM node:current-alpine

WORKDIR /api
COPY package.json index.js  ./
RUN apk update && apk add curl openssl && \
npm install && \
npm prune --production && \
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | sh && \
adduser -D helm

EXPOSE 8080
USER helm

ENTRYPOINT ["node", "index.js"]
