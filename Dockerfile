# Étape 1 : base Node.js
FROM node:20-alpine

# Étape 2 : créer et utiliser le dossier de travail
WORKDIR /app

# Étape 3 : copier les fichiers package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Étape 4 : copier le reste du code
COPY . .

# Étape 5 : compiler le TypeScript si nécessaire
# RUN npm run build  <-- si tu veux builder

# Étape 6 : exposer le port
EXPOSE 5000

# Étape 7 : lancer l'application
CMD ["npm", "run", "dev"]
