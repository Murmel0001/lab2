const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const PORT = 3000;



// ============================
// MIDDLEWARE
// ============================


// enable CORS
app.use(cors());


// parse JSON
app.use(express.json());



// ============================
// API ROUTES
// ============================


const roomRoutes = require('./routes/rooms');

const timetableRoutes = require('./routes/timetable');

const buildingRoutes = require('./routes/buildings');

const teacherRoutes = require('./routes/teachers');

const liveRoutes = require('./routes/live');




app.use('/rooms', roomRoutes);

app.use('/timetable', timetableRoutes);

app.use('/buildings', buildingRoutes);

app.use('/teachers', teacherRoutes);

app.use('/live', liveRoutes);




// ============================
// SERVE FRONTEND
// ============================


// static frontend
app.use(

    express.static(

        path.join(__dirname, '../frontend')

    )

);




// frontend catch-all
app.use((req, res, next) => {


    if (

        req.path.startsWith('/rooms') ||

        req.path.startsWith('/timetable') ||

        req.path.startsWith('/buildings') ||

        req.path.startsWith('/teachers') ||

        req.path.startsWith('/live')

    ) {

        return next();

    }



    res.sendFile(

        path.join(__dirname, '../frontend/index.html')

    );

});




// ============================
// GLOBAL ERROR HANDLER
// ============================


app.use((err, req, res, next) => {


    console.error(err.stack);



    res.status(500).json({

        error: 'Internal server error'

    });

});




// ============================
// START SERVER
// ============================


app.listen(PORT, '0.0.0.0', () => {


    console.log(`Server running on:`);

    console.log(`http://localhost:${PORT}`);

    console.log(`http://127.0.0.1:${PORT}`);


});
