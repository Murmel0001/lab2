const express = require('express');
const router = express.Router();
const db = require('../db');


// GET all teachers
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM teacher');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});


// CREATE new teacher
router.post('/', async (req, res) => {

    const { first_name, last_name, email } = req.body;


    // VALIDATION

    if (!first_name || first_name.trim() === '') {
        return res.status(400).json({
            error: 'First name is required'
        });
    }

    if (!last_name || last_name.trim() === '') {
        return res.status(400).json({
            error: 'Last name is required'
        });
    }


    if (!email || email.trim() === '') {
        return res.status(400).json({
            error: 'Email is required'
        });
    }


    // simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Invalid email format'
        });
    }


    try {

        // check if email already exists
        const [existing] = await db.query(
            'SELECT * FROM teacher WHERE email = ?',
            [email]
        );


        if (existing.length > 0) {

            return res.status(400).json({
                error: 'Teacher with this email already exists'
            });

        }



        const [result] = await db.query(
            'INSERT INTO teacher (first_name, last_name, email) VALUES (?, ?, ?)',
            [first_name, last_name, email]
        );


        res.json({
            id: result.insertId,
            message: 'Teacher created successfully'
        });


    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.sqlMessage || 'Database error'
        });

    }
});



// UPDATE teacher
router.put('/:id', async (req, res) => {

    const { id } = req.params;

    const { first_name, last_name, email } = req.body;



    // VALIDATION

    if (!first_name || first_name.trim() === '') {

        return res.status(400).json({
            error: 'First name is required'
        });

    }


    if (!last_name || last_name.trim() === '') {

        return res.status(400).json({
            error: 'Last name is required'
        });

    }



    if (!email || email.trim() === '') {

        return res.status(400).json({
            error: 'Email is required'
        });

    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(email)) {

        return res.status(400).json({
            error: 'Invalid email format'
        });

    }



    try {


        // check if email exists for another teacher
        const [existing] = await db.query(
            'SELECT * FROM teacher WHERE email = ? AND id != ?',
            [email, id]
        );


        if (existing.length > 0) {

            return res.status(400).json({
                error: 'Another teacher already uses this email'
            });

        }



        await db.query(

            `UPDATE teacher 
             SET first_name = ?, last_name = ?, email = ? 
             WHERE id = ?`,

            [first_name, last_name, email, id]

        );



        res.json({
            message: 'Teacher updated successfully'
        });



    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.sqlMessage || 'Database error'
        });

    }
});



// DELETE teacher
router.delete('/:id', async (req, res) => {

    const { id } = req.params;


    try {


        // get related timetable entries
        const [timetables] = await db.query(

            'SELECT id, description FROM timetable WHERE teacher_id = ?',
            [id]

        );



        // delete timetable entries
        await db.query(

            'DELETE FROM timetable WHERE teacher_id = ?',
            [id]

        );



        // get teacher data
        const [teacherResult] = await db.query(
            'SELECT * FROM teacher WHERE id = ?',
            [id]
        );



        // delete teacher
        await db.query(
            'DELETE FROM teacher WHERE id = ?',
            [id]
        );



        res.json({

            message: 'Teacher and all related timetable entries deleted',

            deletedTeacher: teacherResult[0],

            deletedTimetables: timetables

        });



    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Database error'
        });

    }

});


module.exports = router;
