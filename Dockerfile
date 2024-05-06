###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:20-alpine As development

WORKDIR /node

COPY --chown=node:node bot/package.json .
COPY --chown=node:node bot/package-lock.json .

RUN npm ci

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:20-alpine As build

WORKDIR /node

COPY --chown=node:node bot/package*.json .
COPY --chown=node:node bot/tsconfig*.json .
COPY --chown=node:node bot/nest-cli.json .

COPY --chown=node:node bot/src ./src/
COPY --chown=node:node --from=development /node/node_modules ./node_modules

RUN npm run build

RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:20-alpine As production

MAINTAINER Fluffy_Kaiju, <contact@dreemcloud.net>

RUN adduser --disabled-password --home /home/container container

WORKDIR /home/container

USER container
ENV  USER=container HOME=/home/container

COPY --chown=container:container --from=build /node/node_modules/ ./node_modules/
COPY --chown=container:container --from=build /node/dist/ ./dist/

ENTRYPOINT [ "node", "dist/main"]