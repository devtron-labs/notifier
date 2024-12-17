FROM node:20

WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN npm install

COPY /.  .
RUN  npm run build-ts

RUN groupadd -r devtron && useradd -r -g devtron devtron

ENV TINI_VERSION=v0.18.0
RUN arch=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/) && echo $arch && wget https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${arch} -O /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

USER devtron

CMD ["node","server.js"]
