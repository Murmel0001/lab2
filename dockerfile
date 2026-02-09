# Node.js Basis
FROM node:20

# Arbeitsverzeichnis
WORKDIR /app

# Backend package.json kopieren
COPY backend/package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Backend & Frontend kopieren
COPY backend ./backend
COPY frontend ./frontend

# Port exposen
EXPOSE 3000

# Starten
CMD ["node", "backend/server.js"]
