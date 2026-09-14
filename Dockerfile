# ModelScope Studio compatible image for 9Router
# Requirements: listen on 0.0.0.0:7860, no 8080, data under /mnt/workspace
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
WORKDIR /app

FROM base AS builder
RUN apk --no-cache upgrade && apk --no-cache add python3 make g++ linux-headers
COPY package.json ./
RUN npm install --registry=https://registry.npmmirror.com
COPY . ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
RUN npm run build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/mnt/workspace/9router-data
ENV NEXT_PUBLIC_BASE_URL=""
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/custom-server.js ./custom-server.js
COPY --from=builder /app/keep-alive.mjs ./keep-alive.mjs
COPY --from=builder /app/open-sse ./open-sse
COPY --from=builder /app/src/mitm ./src/mitm
COPY --from=builder /app/node_modules/node-forge ./node_modules/node-forge
COPY --from=builder /app/node_modules/next ./node_modules/next
COPY --from=builder /app/node_modules/sql.js ./node_modules/sql.js
COPY --from=builder /app/node_modules/node-machine-id ./node_modules/node-machine-id
RUN mkdir -p /mnt/workspace/9router-data && chown -R node:node /app /mnt/workspace/9router-data 2>/dev/null || true
RUN apk --no-cache add su-exec && printf '#!/bin/sh\nmkdir -p /mnt/workspace/9router-data 2>/dev/null\nchown -R node:node /mnt/workspace/9router-data 2>/dev/null\nexec su-exec node "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh
EXPOSE 7860
ENTRYPOINT ["/entrypoint.sh"]
CMD ["sh", "-c", "node keep-alive.mjs & exec node custom-server.js"]
