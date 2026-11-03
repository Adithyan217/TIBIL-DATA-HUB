FROM node:23.0-alpine

# Upgrade all vulnerable system packages (musl, busybox, curl, ncurses, etc.)
RUN apk update && apk upgrade && \
    curl --version && \
    musl-gcc --version || true && \
    busybox | head -n 1 || true

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3006
CMD ["npm", "run", "start"]

