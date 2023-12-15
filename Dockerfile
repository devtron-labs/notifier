FROM node AS builder
RUN apt update

WORKDIR /app
COPY package.json .
RUN yarn install

COPY /.  .
RUN  yarn build-ts


FROM node:14.2.0
RUN echo "deb http://archive.debian.org/debian stretch main contrib non-free" > /etc/apt/sources.list
RUN apt update

ENV TINI_VERSION v0.18.0
RUN arch=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/) && echo $arch && wget https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${arch} -O /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

WORKDIR /app
COPY --from=builder /app/dist/ ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/config/ ./config/

CMD ["node","server.js"]
