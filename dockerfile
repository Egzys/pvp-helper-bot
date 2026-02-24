FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "scr/bot.js" ]