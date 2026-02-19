const express = require('express');
const router = express.Router();
const db = require('../db');
const { zonedTimeToUtc, utcToZonedTime, format } = require('date-fns-tz');
const TIMEZONE = 'Europe/Berlin';


// =============================
// GET all bookings
// =============================
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                t.id,
                t.room_id,
                r.room_nr,
                t.teacher_id,
                CONCAT(tea.first_name, ' ', tea.last_name) AS teacher_name,
                t.start_time,
                t.end_time,
                t.description
            FROM timetable t
            JOIN room r ON t.room_id = r.id
            JOIN teacher tea ON t.teacher_id = tea.id
        `);

        // convert times to Berlin timezone before sending
        const rowsBerlin = rows.map(r => ({
            ...r,
            start_time: format(utcToZonedTime(r.start_time, TIMEZONE), "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: TIMEZONE }),
            end_time: format(utcToZonedTime(r.end_time, TIMEZONE), "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: TIMEZONE }),
        }));

        res.json(rowsBerlin);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error while fetching bookings' });
    }
});

// =============================
// CREATE booking
// =============================
router.post('/', async (req, res) => {
    try {
        const { room_id, teacher_id, start_time, end_time, description } = req.body;

        if (!room_id || !teacher_id || !start_time || !end_time) {
            return res.status(400).json({ error: 'Room, teacher, start time and end time are required' });
        }

        // Convert incoming Berlin time to UTC for DB storage
        const startUtc = zonedTimeToUtc(start_time, TIMEZONE);
        const endUtc = zonedTimeToUtc(end_time, TIMEZONE);
        const nowUtc = new Date();

        if (startUtc >= endUtc) return res.status(400).json({ error: 'Start time must be before end time' });
        if (startUtc < nowUtc) return res.status(400).json({ error: 'Start time cannot be in the past' });

        // teacher conflict
        const [teacherConflicts] = await db.query(
            `SELECT id FROM timetable
             WHERE teacher_id = ?
             AND (start_time < ? AND end_time > ?)`,
            [teacher_id, endUtc, startUtc]
        );
        if (teacherConflicts.length > 0) return res.status(400).json({ error: 'Teacher is already booked during this time' });

        // room conflict
        const [roomConflicts] = await db.query(
            `SELECT id FROM timetable
             WHERE room_id = ?
             AND (start_time < ? AND end_time > ?)`,
            [room_id, endUtc, startUtc]
        );
        if (roomConflicts.length > 0) return res.status(400).json({ error: 'Room is already booked during this time' });

        // insert booking
        const [result] = await db.query(
            `INSERT INTO timetable
            (room_id, teacher_id, start_time, end_time, description)
            VALUES (?, ?, ?, ?, ?)`,
            [room_id, teacher_id, startUtc, endUtc, description || null]
        );

        res.status(201).json({ message: 'Booking created successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || 'Database error while creating booking' });
    }
});

// =============================
// UPDATE booking
// =============================
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { room_id, teacher_id, start_time, end_time, description } = req.body;

        if (!room_id || !teacher_id || !start_time || !end_time) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        const startUtc = zonedTimeToUtc(start_time, TIMEZONE);
        const endUtc = zonedTimeToUtc(end_time, TIMEZONE);

        await db.query(
            `UPDATE timetable
             SET room_id = ?, teacher_id = ?, start_time = ?, end_time = ?, description = ?
             WHERE id = ?`,
            [room_id, teacher_id, startUtc, endUtc, description || null, id]
        );

        res.json({ message: 'Booking updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || 'Database error while updating booking' });
    }
});

// =============================
// DELETE booking
// =============================
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await db.query(`DELETE FROM timetable WHERE id = ?`, [id]);
        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error while deleting booking' });
    }
});

module.exports = router;
