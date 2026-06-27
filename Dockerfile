# -------- BUILDER --------
FROM node:20.18.0-bullseye-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    git \
    make \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN sed -i 's%./node_modules/.bin/tsx%node%g' ./bin/mercury.mjs && \
    npm_config_python=/usr/bin/python3 npm ci --loglevel http && \
    ./node_modules/.bin/tsc -p tsconfig.node.json && \
    npm prune --production

# The UI is proprietary and lives in the private `mercury-ui` repository.
# This repo ships only the prebuilt output under ui/dist, so there is no UI
# build step here. ui/dist is copied verbatim into the runtime image below.

# -------- RUNTIME --------
FROM node:20.18.0-bullseye-slim

LABEL org.opencontainers.image.source=https://github.com/erdncyz/mercury
LABEL org.opencontainers.image.title=Mercury
LABEL org.opencontainers.image.vendor=erdncyz
LABEL org.opencontainers.image.description="Control and manage Android and iOS devices from your browser."
LABEL org.opencontainers.image.licenses=Apache-2.0

ENV PATH=/app/bin:$PATH
ENV NODE_OPTIONS="--max-old-space-size=32768"

EXPOSE 3000
WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --create-home --shell /usr/sbin/nologin mercury-user

COPY --from=builder /app .
RUN rm -rf ./ui
COPY --from=builder /app/ui/dist ./ui/dist

RUN ln -s /app/bin/mercury.mjs /app/bin/mercury && \
    ln -s /app/bin/mercury.mjs /app/bin/dh

USER mercury-user

CMD ["mercury", "--help"]
