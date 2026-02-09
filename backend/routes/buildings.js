const express = require('express');
const router = express.Router();
const db = require('../db');

// Alle Gebäude anzeigen
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM building');
        console.log('Rows:', rows);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// POST /buildings
router.post('/', async (req, res) => {
    const { name, address, description } = req.body;

    try {
        // Prüfen, ob Gebäude schon existiert
        const [existing] = await db.query('SELECT * FROM building WHERE name = ? AND address = ?', [name, address]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Gebäude mit diesem Namen und Adresse existiert bereits.' });
        }

        const [result] = await db.query(
            'INSERT INTO building (name, address, description) VALUES (?, ?, ?)',
            [name, address, description]
        );
        res.json({ id: result.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// Gebäude bearbeiten
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, address, description } = req.body;
    try {
        await db.query(
            'UPDATE building SET name=?, address=?, description=? WHERE id=?',
            [name, address, description, id]
        );
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// Gebäude löschen
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Räume abrufen, die zu diesem Gebäude gehören
        const [rooms] = await db.query('SELECT id, room_nr FROM room WHERE building_id = ?', [id]);
        const roomIds = rooms.map(r => r.id);

        // 2. Belegungen löschen, die zu diesen Räumen gehören
        let deletedTimetables = [];
        if (roomIds.length > 0) {
            const [timetableRows] = await db.query('SELECT id, description FROM timetable WHERE room_id IN (?)', [roomIds]);
            deletedTimetables = timetableRows;
            await db.query('DELETE FROM timetable WHERE room_id IN (?)', [roomIds]);
        }

        // 3. Räume löschen
        await db.query('DELETE FROM room WHERE building_id = ?', [id]);

        // 4. Gebäude löschen
        await db.query('DELETE FROM building WHERE id = ?', [id]);

        res.json({
            message: 'Gebäude und alle zugehörigen Objekte gelöscht',
            deletedRooms: rooms,
            deletedTimetables: deletedTimetables
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});


module.exports = router;
