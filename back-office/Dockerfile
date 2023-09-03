FROM node:current-alpine

COPY package.json index.js ./
RUN npm install && \
  npm prune --production

CMD ["node", "index.js"]
