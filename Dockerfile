FROM node:20.19.0 as build

WORKDIR /var/app
COPY . /var/app
ENV NODE_OPTIONS --openssl-legacy-provider
RUN yarn install
RUN yarn build-version && export NODE_OPTIONS=--openssl-legacy-provider && yarn build

FROM node:20.19.0-alpine

WORKDIR /var/app

ARG SOURCE_COMMIT
ENV SOURCE_COMMIT ${SOURCE_COMMIT}

COPY --from=build /var/app /var/app
ENV PORT 8080
ENV NODE_ENV production
ENV NODE_OPTIONS --openssl-legacy-provider

EXPOSE 8080
CMD [ "yarn", "run", "prod" ]
