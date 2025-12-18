FROM node:18 AS builder

WORKDIR /app
COPY package.json .
RUN yarn install

COPY /.  .
RUN  yarn build-ts

FROM node:18-slim

RUN groupadd -r devtron && useradd -r -g devtron devtron

ENV TINI_VERSION v0.18.0
RUN arch=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/) && echo $arch && wget https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${arch} -O /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

WORKDIR /app
COPY --from=builder --chown=devtron:devtron /app/dist/ ./
COPY --from=builder --chown=devtron:devtron /app/node_modules ./node_modules
COPY --from=builder --chown=devtron:devtron /app/config/ ./config/

USER devtron

CMD ["node","server.js"]
