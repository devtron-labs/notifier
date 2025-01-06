FROM node AS builder

WORKDIR /app
COPY package.json .
RUN yarn install

COPY /.  .
RUN  yarn build-ts

FROM node:14.2.0


ENV TINI_VERSION v0.18.0

RUN arch=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/) && echo $arch && wget https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${arch} -O /tini && \
	groupadd -r devtron && useradd -r -g devtron devtron && \
        apt autoremove -y && \
        rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder --chown=devtron:devtron /app/dist/ ./
COPY --from=builder --chown=devtron:devtron /app/node_modules ./node_modules
COPY --from=builder --chown=devtron:devtron /app/config/ ./config/

USER devtron

ENTRYPOINT ["/tini", "--"]

CMD ["node","server.js"]
