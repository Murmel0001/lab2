# 1. Node-Image als Basis
FROM node:20-alpine

# 2. Arbeitsverzeichnis im Container
WORKDIR /app

# 3. package.json und package-lock.json kopieren und Dependencies installieren
COPY package*.json ./
RUN npm install --production

# 4. Quellcode kopieren (Backend + Frontend)
COPY . .

# 5. Port freigeben
EXPOSE 3000

# 6. Startbefehl
CMD ["node", "server.js"]
