# 1. Node Base Image
FROM node:18-bullseye

# 2. Arbeitsverzeichnis
WORKDIR /app

# 3. Kopiere nur package.json + package-lock.json zuerst
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 4. Systemabhängigkeiten für Node Modules (falls native Module gebaut werden müssen)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 5. Backend Dependencies installieren
WORKDIR /app/backend
RUN npm install --legacy-peer-deps

# 6. Frontend Dependencies installieren (falls notwendig)
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps

# 7. Gesamtes Projekt kopieren
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# 8. Port freigeben
EXPOSE 3000

# 9. Start Command
WORKDIR /app/backend
CMD ["node", "index.js"]

