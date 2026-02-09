const express = require('express');
const router = express.Router();
const db = require('../db');

// Alle Lehrer anzeigen
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM teacher');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// POST /teachers
router.post('/', async (req, res) => {
    const { first_name, last_name, email } = req.body;

    try {
        // Prüfen, ob Lehrer mit dieser Email existiert
        const [existing] = await db.query('SELECT * FROM teacher WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Lehrer mit dieser E-Mail existiert bereits.' });
        }

        const [result] = await db.query(
            'INSERT INTO teacher (first_name, last_name, email) VALUES (?, ?, ?)',
            [first_name, last_name, email]
        );
        res.json({ id: result.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});


// Lehrer bearbeiten
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email } = req.body;
    try {
        await db.query(
            'UPDATE teacher SET first_name=?, last_name=?, email=? WHERE id=?',
            [first_name, last_name, email, id]
        );
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || 'DB Error' });
    }
});

// Lehrer löschen
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Belegungen abrufen
        const [timetables] = await db.query('SELECT id, description FROM timetable WHERE teacher_id = ?', [id]);
        await db.query('DELETE FROM timetable WHERE teacher_id = ?', [id]);

        // Lehrer löschen
        const [teacherResult] = await db.query('SELECT * FROM teacher WHERE id=?', [id]);
        await db.query('DELETE FROM teacher WHERE id=?', [id]);

        res.json({
            message: 'Lehrer und alle zugehörigen Belegungen gelöscht',
            deletedTeacher: teacherResult[0],
            deletedTimetables: timetables
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});


module.exports = router;
