const express = require('express');
const router = express.Router();
const db = require('../db');
const { utcToZonedTime, format } = require('date-fns-tz');

const TIMEZONE = 'Europe/Berlin';

// GET live view page
router.get('/', async (req, res) => {
    try {
        const now = new Date();

        const [rows] = await db.query(`
    SELECT 
        t.id,
        t.room_id,
        r.room_nr,
        b.name AS building_name,
        b.address AS building_address,
        t.teacher_id,
        CONCAT(tea.first_name, ' ', tea.last_name) AS teacher_name,
        t.start_time,
        t.end_time,
        t.description
    FROM timetable t
    JOIN room r ON t.room_id = r.id
    JOIN building b ON r.building_id = b.id
    JOIN teacher tea ON t.teacher_id = tea.id
    WHERE t.end_time > ?
    ORDER BY t.start_time ASC
`, [now]);


        const rowsBerlin = rows.map(r => {

            const startUTC = new Date(r.start_time);
            const endUTC = new Date(r.end_time);

            const startBerlin = utcToZonedTime(startUTC, TIMEZONE);
            const endBerlin = utcToZonedTime(endUTC, TIMEZONE);

            return {
                ...r,

                start_time_utc: startUTC,
                end_time_utc: endUTC,

                start_time: format(startBerlin, 'HH:mm', { timeZone: TIMEZONE }),
                end_time: format(endBerlin, 'HH:mm', { timeZone: TIMEZONE }),

                date: format(startBerlin, 'yyyy-MM-dd', { timeZone: TIMEZONE })
            };
        });


        const grouped = {};
        rowsBerlin.forEach(r => {
            if (!grouped[r.date]) grouped[r.date] = [];
            grouped[r.date].push(r);
        });

        // HTML
        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Live Room Schedule</title>
<style>
    body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    h1 { text-align: center; color: #333; margin-bottom: 30px; }
    h2 { margin-top: 30px; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .booking { display: flex; gap: 15px; background: #fff; padding: 10px 15px; border-radius: 8px; margin: 8px 0; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .booking.current { background: #c8e6c9; font-weight: bold; }
    .booking .time { font-weight: bold; width: 70px; }
    .booking .room { width: 60px; }
    .booking .teacher { flex: 1; }
    .booking .desc { flex: 2; color: #555; }
    .booking .building {
    width: 220px;
}

.booking .building small {
    font-size: 0.8em;
    color: #777;
}

</style>
</head>
<body>
<h1>Live Room Schedule</h1>

${Object.keys(grouped).map(date => `
    <h2>${date}</h2>
    ${grouped[date].map(b => {
            const nowBerlin = utcToZonedTime(now, TIMEZONE);

            const isCurrent =
                nowBerlin >= utcToZonedTime(b.start_time_utc, TIMEZONE) &&
                nowBerlin <= utcToZonedTime(b.end_time_utc, TIMEZONE);

            return `
        <div class="booking ${isCurrent ? 'current' : ''}">
            <div class="time">${b.start_time} - ${b.end_time}</div>
<div class="room">Room ${b.room_nr}</div>

<div class="building">
    ${b.building_name}<br>
    <small>${b.building_address}</small>
</div>

            <div class="teacher">${b.teacher_name}</div>
            <div class="desc">${b.description || ''}</div>
        </div>`;
        }).join('')}
`).join('')}

<script>
    // Auto-refresh alle 30 Sekunden
    setTimeout(() => { window.location.reload(); }, 3000);
</script>
</body>
</html>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching live room schedule');
    }
});

module.exports = router;
