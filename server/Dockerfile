
FROM node:18-alpine


WORKDIR /app


RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*


COPY package*.json ./


RUN npm ci --only=production && npm cache clean --force



COPY . .


RUN chown -R nodejs:nodejs /app


EXPOSE 3000


CMD ["npm", "start"]
