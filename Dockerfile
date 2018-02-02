# Do the npm install on the full image
FROM node:8.9.3 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --quiet --production

COPY doc/api-doc.yml doc/
COPY src src/
COPY version.json ./

# Only copy needed pieces from the build step
FROM node:8.9.3-alpine

WORKDIR /app
COPY --from=builder /app .

RUN apk --update add curl

# check every 30s to ensure this service returns HTTP 200
HEALTHCHECK CMD curl -fs http://localhost:$MIRA_API_PORT/v1/health || exit 1

ARG MIRA_API_PORT=9100
ENV MIRA_API_PORT $MIRA_API_PORT
EXPOSE $MIRA_API_PORT

ENV MIRA_CONTAINERIZED true

ENTRYPOINT ["node", "./src/index.js"]
