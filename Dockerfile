FROM node:16.13

WORKDIR /opt/transaction-validator

COPY package*.json ./

RUN npm ci --production

COPY . .

ENV MONGO_URI=mongodb://192.168.65.0:27017/transactions

ENV AMQP_HOST=amqp://guest:guest@172.17.0.2:5672/transactions

ENV AMQP_QUEUE_NAME=outgoing-queue

ENV AMQP_NOTIFY_QUEUE=notify-queue


CMD [ "npm", "start" ]
