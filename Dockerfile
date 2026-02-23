FROM node:24-bookworm-slim

WORKDIR /app

# Git is required for git-based npm dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./

RUN corepack enable && yarn install --production

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["bin/hubot", "-a", "slack"]
