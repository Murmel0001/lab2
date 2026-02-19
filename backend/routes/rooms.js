const express = require('express');
const router = express.Router();
const db = require('../db');


// =====================================
// GET all rooms
// =====================================
router.get('/', async (req, res) => {

    try {

        const [rows] = await db.query(`SELECT * FROM room`);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Database error while fetching rooms'
        });

    }

});


// =====================================
// CREATE room
// =====================================
router.post('/', async (req, res) => {

    try {

        const {
            building_id,
            floor,
            room_nr,
            capacity,
            description
        } = req.body;


        // ============================
        // REQUIRED FIELD VALIDATION
        // ============================

        if (!building_id || !room_nr || floor === undefined) {

            return res.status(400).json({
                error: 'Building, floor and room number are required'
            });

        }


        // ============================
        // TYPE VALIDATION
        // ============================

        const parsedCapacity = capacity ? parseInt(capacity) : 0;
        const parsedFloor = parseInt(floor);


        if (isNaN(parsedFloor)) {

            return res.status(400).json({
                error: 'Floor must be a valid number'
            });

        }


        if (parsedCapacity < 0) {

            return res.status(400).json({
                error: 'Capacity cannot be negative'
            });

        }


        if (parsedCapacity > 1000) {

            return res.status(400).json({
                error: 'Capacity is unrealistically high'
            });

        }


        // ============================
        // CHECK building exists
        // ============================

        const [building] = await db.query(

            `SELECT id FROM building WHERE id = ?`,

            [building_id]

        );


        if (building.length === 0) {

            return res.status(400).json({
                error: 'Building does not exist'
            });

        }


        // ============================
        // CHECK duplicate room number
        // ============================

        const [existing] = await db.query(

            `SELECT id FROM room
             WHERE building_id = ?
             AND room_nr = ?`,

            [building_id, room_nr]

        );


        if (existing.length > 0) {

            return res.status(400).json({

                error: 'Room number already exists in this building'

            });

        }


        // ============================
        // INSERT room
        // ============================

        const [result] = await db.query(

            `INSERT INTO room
            (building_id, floor, room_nr, capacity, description)
            VALUES (?, ?, ?, ?, ?)`,

            [
                building_id,
                parsedFloor,
                room_nr,
                parsedCapacity,
                description || null
            ]

        );


        res.status(201).json({

            message: 'Room created successfully',
            id: result.insertId

        });


    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.sqlMessage ||
                'Database error while creating room'

        });

    }

});


// =====================================
// UPDATE room
// =====================================
router.put('/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const {
            building_id,
            floor,
            room_nr,
            capacity,
            description
        } = req.body;


        if (!building_id || !room_nr || floor === undefined) {

            return res.status(400).json({

                error: 'Required fields missing'

            });

        }


        const parsedCapacity = capacity ? parseInt(capacity) : 0;
        const parsedFloor = parseInt(floor);


        if (parsedCapacity < 0) {

            return res.status(400).json({

                error: 'Capacity cannot be negative'

            });

        }


        await db.query(

            `UPDATE room SET
                building_id = ?,
                floor = ?,
                room_nr = ?,
                capacity = ?,
                description = ?
             WHERE id = ?`,

            [
                building_id,
                parsedFloor,
                room_nr,
                parsedCapacity,
                description || null,
                id
            ]

        );


        res.json({

            message: 'Room updated successfully'

        });


    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.sqlMessage ||
                'Database error while updating room'

        });

    }

});


// =====================================
// DELETE room
// =====================================
router.delete('/:id', async (req, res) => {

    try {

        const id = req.params.id;


        // get related bookings
        const [bookings] = await db.query(

            `SELECT id, description
             FROM timetable
             WHERE room_id = ?`,

            [id]

        );


        // delete bookings
        await db.query(

            `DELETE FROM timetable WHERE room_id = ?`,

            [id]

        );


        // get room info
        const [room] = await db.query(

            `SELECT * FROM room WHERE id = ?`,

            [id]

        );


        if (room.length === 0) {

            return res.status(404).json({

                error: 'Room not found'

            });

        }


        // delete room
        await db.query(

            `DELETE FROM room WHERE id = ?`,

            [id]

        );


        res.json({

            message: 'Room and related bookings deleted successfully',

            deletedRoom: room[0],

            deletedBookings: bookings

        });


    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: 'Database error while deleting room'

        });

    }

});


// =====================================
// GET rooms by building
// =====================================
router.get('/by-building/:building_id', async (req, res) => {

    try {

        const building_id = req.params.building_id;


        const [rows] = await db.query(

            `SELECT id, room_nr, floor, capacity, description
             FROM room
             WHERE building_id = ?`,

            [building_id]

        );


        res.json(rows);


    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: 'Database error while fetching rooms'

        });

    }

});


module.exports = router;
