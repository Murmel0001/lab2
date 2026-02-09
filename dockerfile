# --- Base Image ---
FROM node:18

# Arbeitsverzeichnis
WORKDIR /app

# package.json + package-lock.json kopieren
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install Backend Dependencies
WORKDIR /app/backend
RUN npm install

# Install Frontend Dependencies (falls notwendig)
WORKDIR /app/frontend
RUN npm install

# App kopieren
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Ports
EXPOSE 3000

# Start Command (Backend + Static Frontend)
WORKDIR /app/backend
CMD ["node", "server.js"]
