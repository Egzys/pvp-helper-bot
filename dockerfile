FROM node:18-slim

WORKDIR /app

# On copie les fichiers de dépendances
COPY package*.json ./

# On installe les modules (ça ira très vite sans better-sqlite3)
RUN npm install

# On copie le reste du code
COPY . .

# On lance la poutre
CMD node deploy-commands.js && node src/bot.js