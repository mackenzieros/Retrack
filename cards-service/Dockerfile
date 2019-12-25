FROM node

RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app/

COPY package*.json ./
COPY babel.config.js ./
COPY ./src/ ./src/

RUN npm install
RUN npm install --save-dev nodemon
RUN npm run transpile

COPY . .

EXPOSE 5000

CMD ["npm", "run", "devstart"]
