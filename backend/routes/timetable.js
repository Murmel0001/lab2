const express = require('express');
const router = express.Router();
const db = require('../db');

// Alle Belegungen anzeigen
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT t.id, t.room_id, r.room_nr, t.teacher_id, CONCAT(tea.first_name,' ',tea.last_name) as teacher_name,
              t.start_time, t.end_time, t.description
       FROM timetable t
       JOIN room r ON t.room_id = r.id
       JOIN teacher tea ON t.teacher_id = tea.id`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// Neue Belegung anlegen
router.post('/', async (req, res) => {
    const { room_id, teacher_id, start_time, end_time, description } = req.body;
    // Vor dem Insert prüfen
    const [conflicts] = await db.query(
        `SELECT * FROM timetable 
     WHERE teacher_id = ? 
       AND (start_time < ? AND end_time > ?)`,
        [teacher_id, end_time, start_time]
    );

    const [roomConflicts] = await db.query(
        `SELECT * FROM timetable 
     WHERE room_id = ? 
       AND (start_time < ? AND end_time > ?)`,
        [room_id, end_time, start_time]
    );

    if (conflicts.length > 0) {
        return res.status(400).json({ error: 'Lehrer ist in dieser Zeit bereits belegt.' });
    }

    if (roomConflicts.length > 0) {
        return res.status(400).json({ error: 'Raum ist in dieser Zeit bereits belegt.' });
    }

    if (new Date(start_time) >= new Date(end_time)) {
        return res.status(400).json({ error: 'Startzeit muss vor Endzeit liegen.' });
    }

    if (new Date(start_time) < new Date()) {
        return res.status(400).json({ error: 'Startzeit liegt in der Vergangenheit.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO timetable (room_id, teacher_id, start_time, end_time, description) VALUES (?, ?, ?, ?, ?)',
            [room_id, teacher_id, start_time, end_time, description]
        );
        res.json({ id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || 'DB Error' });
    }
});

// Belegung bearbeiten
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { room_id, teacher_id, start_time, end_time, description } = req.body;
    try {
        await db.query(
            'UPDATE timetable SET room_id=?, teacher_id=?, start_time=?, end_time=?, description=? WHERE id=?',
            [room_id, teacher_id, start_time, end_time, description, id]
        );
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || 'DB Error' });
    }
});

// Belegung löschen
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM timetable WHERE id=?', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

module.exports = router;
