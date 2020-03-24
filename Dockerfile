FROM node:12.16.1
LABEL maintainer="Automattic"

WORKDIR    /calypso


ENV        CONTAINER 'docker'
ENV        PROGRESS=true

# Build a "base" layer
#
# This layer should never change unless env-config.sh
# changes. For local development this should always
# be an empty file and therefore this layer should
# cache well.
#
# env-config.sh
#   used by systems to overwrite some defaults
#   such as the apt and npm mirrors
COPY       ./env-config.sh /tmp/env-config.sh
RUN        bash /tmp/env-config.sh

# Build a "source" layer
#
# This layer is populated with up-to-date files from
# Calypso development.
COPY . /calypso/
RUN npm ci


# Build the final layer
#
# This contains built environments of Calypso. It will
# change any time any of the Calypso source-code changes.
ARG        commit_sha="(unknown)"
ENV        COMMIT_SHA $commit_sha

ARG        workers
RUN        WORKERS=$workers CALYPSO_ENV=production CHUNKS_MAP=true npm run build

# Build translation chunks
#
# This depends on having chunks map generated , which is
# enabled in the previous step with `CHUNKS_MAP=true`
RUN        npm run build-languages

USER       nobody
CMD        NODE_ENV=production node build/bundle.js
