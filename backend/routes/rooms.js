const express = require('express');
const router = express.Router();
const db = require('../db');

// Alle Räume anzeigen
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM room');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// POST /rooms
router.post('/', async (req, res) => {
    const { building_id, floor, room_nr, capacity, description } = req.body;

    try {
        // Prüfen, ob Raum im Gebäude schon existiert
        const [existing] = await db.query(
            'SELECT * FROM room WHERE building_id = ? AND room_nr = ?',
            [building_id, room_nr]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Raum mit dieser Nummer existiert bereits in diesem Gebäude.' });
        }

        const [result] = await db.query(
            'INSERT INTO room (building_id, floor, room_nr, capacity, description) VALUES (?, ?, ?, ?, ?)',
            [building_id, floor, room_nr, capacity, description]
        );
        res.json({ id: result.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});


// Raum bearbeiten
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { building_id, floor, room_nr, capacity, description } = req.body;
    try {
        await db.query(
            'UPDATE room SET building_id=?, floor=?, room_nr=?, capacity=?, description=? WHERE id=?',
            [building_id, floor, room_nr, capacity, description, id]
        );
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// Raum löschen
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Belegungen des Raums abrufen und löschen
        const [timetables] = await db.query('SELECT id, description FROM timetable WHERE room_id = ?', [id]);
        await db.query('DELETE FROM timetable WHERE room_id = ?', [id]);

        // 2. Raum löschen
        const [roomResult] = await db.query('SELECT * FROM room WHERE id=?', [id]);
        await db.query('DELETE FROM room WHERE id=?', [id]);

        res.json({
            message: 'Raum und alle zugehörigen Belegungen gelöscht',
            deletedRoom: roomResult[0],
            deletedTimetables: timetables
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});


// Raum im gebäude
router.get('/by-building/:building_id', async (req, res) => {
    const { building_id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT id, room_nr, floor FROM room WHERE building_id = ?',
            [building_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

module.exports = router;
