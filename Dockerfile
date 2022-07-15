FROM node AS builder

WORKDIR /app
COPY package.json .
RUN yarn install

COPY /.  .
RUN  yarn build-ts


FROM node:14.2.0

ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

WORKDIR /app
COPY --from=builder /app/dist/ ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/config/ ./config/
COPY /app/a.js ./node_modules/notifme-sdk/lib/providers/email/ses.js

CMD ["node","server.js"]
