# 1. Node.js Basisimage
FROM node:20-alpine

# 2. Arbeitsverzeichnis im Container
WORKDIR /app

# 3. package.json und package-lock.json kopieren
COPY package*.json ./

# 4. Node Modules installieren
RUN npm install --production

# 5. Backend und Frontend kopieren
COPY backend ./backend
COPY frontend ./frontend

# 6. Port freigeben
EXPOSE 3000

# 7. Startbefehl: server.js im backend-Ordner
CMD ["node", "backend/server.js"]
