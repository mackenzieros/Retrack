FROM node

RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app/

COPY package*.json serverless.yml handler.js ./

RUN npm install

EXPOSE 5000

CMD ["npm", "run", "deploy"]
