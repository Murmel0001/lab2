# 1️⃣ Basis-Image
FROM node:20-alpine

# 2️⃣ Arbeitsverzeichnis im Container
WORKDIR /app

# 3️⃣ Abhängigkeiten kopieren
COPY package*.json ./

# 4️⃣ Node Modules installieren
RUN npm install

# 5️⃣ Restlichen Quellcode kopieren
COPY . .

# 6️⃣ Port freigeben
EXPOSE 3000

# 7️⃣ Startbefehl: Node-Server starten
CMD ["node", "server.js"]
