# --- Base Image: Node + Debian ---
FROM node:18-bullseye

# --- Arbeitsverzeichnis ---
WORKDIR /app

# --- Systemabhängigkeiten für node-gyp / native Modules ---
RUN apt-get update && \
    apt-get install -y python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

# --- package.json + package-lock.json kopieren (Backend zuerst) ---
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# --- Backend installieren ---
WORKDIR /app/backend
RUN npm install --legacy-peer-deps

# --- Frontend installieren (falls nötig) ---
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps

# --- Restliche Dateien kopieren ---
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# --- Port freigeben ---
EXPOSE 3000

# --- Start Command (Backend) ---
WORKDIR /app/backend
CMD ["node", "index.js"]

