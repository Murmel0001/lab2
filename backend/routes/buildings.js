const express = require('express');
const router = express.Router();
const db = require('../db');



// GET all buildings
router.get('/', async (req, res) => {

    try {

        const [rows] = await db.query(
            'SELECT * FROM building'
        );

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Database error'
        });

    }

});




// CREATE building
router.post('/', async (req, res) => {

    const { name, address, description } = req.body;



    // VALIDATION

    if (!name || name.trim() === '') {

        return res.status(400).json({
            error: 'Building name is required'
        });

    }



    if (!address || address.trim() === '') {

        return res.status(400).json({
            error: 'Building address is required'
        });

    }




    try {


        // CHECK duplicate
        const [existing] = await db.query(

            `SELECT * FROM building 
             WHERE name = ? AND address = ?`,

            [name, address]

        );



        if (existing.length > 0) {

            return res.status(400).json({
                error: 'Building with this name and address already exists'
            });

        }




        const [result] = await db.query(

            `INSERT INTO building 
            (name, address, description) 
            VALUES (?, ?, ?)`,

            [name, address, description || null]

        );



        res.json({

            id: result.insertId,

            message: 'Building created successfully'

        });



    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.sqlMessage || 'Database error'

        });

    }

});





// UPDATE building
router.put('/:id', async (req, res) => {

    const { id } = req.params;

    const { name, address, description } = req.body;




    // VALIDATION

    if (!name || name.trim() === '') {

        return res.status(400).json({
            error: 'Building name is required'
        });

    }


    if (!address || address.trim() === '') {

        return res.status(400).json({
            error: 'Building address is required'
        });

    }




    try {



        // check duplicate for another building
        const [existing] = await db.query(

            `SELECT * FROM building 
             WHERE name = ? AND address = ? AND id != ?`,

            [name, address, id]

        );



        if (existing.length > 0) {

            return res.status(400).json({
                error: 'Another building with this name and address already exists'
            });

        }




        await db.query(

            `UPDATE building 
             SET name = ?, address = ?, description = ? 
             WHERE id = ?`,

            [name, address, description || null, id]

        );



        res.json({

            message: 'Building updated successfully'

        });



    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.sqlMessage || 'Database error'

        });

    }

});




// DELETE building
router.delete('/:id', async (req, res) => {

    const { id } = req.params;



    try {



        // GET rooms
        const [rooms] = await db.query(

            'SELECT id, room_nr FROM room WHERE building_id = ?',

            [id]

        );



        const roomIds = rooms.map(room => room.id);




        // DELETE timetables
        let deletedTimetables = [];


        if (roomIds.length > 0) {


            const [timetableRows] = await db.query(

                'SELECT id, description FROM timetable WHERE room_id IN (?)',

                [roomIds]

            );


            deletedTimetables = timetableRows;



            await db.query(

                'DELETE FROM timetable WHERE room_id IN (?)',

                [roomIds]

            );

        }




        // DELETE rooms
        await db.query(

            'DELETE FROM room WHERE building_id = ?',

            [id]

        );




        // GET building info
        const [buildingResult] = await db.query(

            'SELECT * FROM building WHERE id = ?',

            [id]

        );




        // DELETE building
        await db.query(

            'DELETE FROM building WHERE id = ?',

            [id]

        );




        res.json({

            message: 'Building and all related data deleted',

            deletedBuilding: buildingResult[0],

            deletedRooms: rooms,

            deletedTimetables: deletedTimetables

        });



    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: 'Database error'

        });

    }

});


module.exports = router;
