const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors()); // CORS für alle Domains erlauben
app.use(express.json());

// --- API-Routen einbinden ---
const roomRoutes = require('./routes/rooms');
const timetableRoutes = require('./routes/timetable');
const buildingRoutes = require('./routes/buildings');
const teacherRoutes = require('./routes/teachers');

app.use('/rooms', roomRoutes);
app.use('/timetable', timetableRoutes);
app.use('/buildings', buildingRoutes);
app.use('/teachers', teacherRoutes);

// --- Frontend servieren ---
// Annahme: Frontend liegt im Ordner '../frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-All: Frontend für alle nicht-API-Routen
// Catch-All nur für HTML Frontend, alle /api-Routen ausschließen
app.use((req, res, next) => {
    if (req.path.startsWith('/rooms') ||
        req.path.startsWith('/timetable') ||
        req.path.startsWith('/buildings') ||
        req.path.startsWith('/teachers')) {
        return next(); // API-Routen weiterleiten
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// --- Server starten ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
