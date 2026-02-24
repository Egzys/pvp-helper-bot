# On utilise une version stable de Node
FROM node:18-slim

# On copie les fichiers de dépendances
COPY package*.json ./

# On installe TOUT (la compilation se fera ici, sans erreur !)
RUN npm install

# On copie le reste du code
COPY . .

# On lance la poutre
CMD [ "node", "src/bot.js" ]