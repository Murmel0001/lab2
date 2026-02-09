const API = 'https://lab2.marc-hornig.de';

// --- Notifications ---
function showNotification(message, type = 'info') {
    const notif = document.getElementById('notifications');
    if (!notif) return;

    const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'black';
    const li = document.createElement('li');
    li.style.color = color;
    li.innerHTML = message;

    notif.prepend(li);

    while (notif.children.length > 2) {
        notif.removeChild(notif.lastChild);
    }
}

function formatDateTime(dtString) {
    const dt = new Date(dtString);
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function setEmpty(list, text) {
    list.innerHTML = `<li class="empty-text">${text}</li>`;
}

// --- Gebäude ---
async function fetchBuildings() {
    try {
        const res = await fetch(`${API}/buildings`);
        const buildings = await res.json();
        window.buildings = buildings;

        const list = document.getElementById('building-list');
        const select = document.getElementById('room-building');

        if (!list || !select) return;

        list.innerHTML = '';
        select.innerHTML = '<option value="">-- Select building --</option>';

        if (buildings.length === 0) {
            list.innerHTML = '<li class="empty-text">No buildings available</li>';
            select.innerHTML = '<option value="">-- Add building first --</option>';
            return;
        }

        buildings.forEach(b => {
            list.innerHTML += `<li>
                <div>${b.name}</div>
                <div>${b.address}</div>
                <div class="buttons">
                    <button onclick="updateBuilding(${b.id})">Edit</button>
                    <button onclick="deleteBuilding(${b.id})">Delete</button>
                </div>
            </li>`;
            select.innerHTML += `<option value="${b.id}">${b.name}</option>`;
        });
    } catch (err) {
        console.error(err);
        showNotification('Error loading buildings: ' + err.message, 'error');
    }
}

async function fetchBuildingsForTimetable() {
    const res = await fetch(`${API}/buildings`);
    const buildings = await res.json();
    const buildingSelect = document.getElementById('tt-building');
    buildingSelect.innerHTML = '<option value="">-- Select building --</option>';
    buildings.forEach(b => {
        buildingSelect.innerHTML += `<option value="${b.id}">${b.name} (${b.address})</option>`;
    });
}

async function createBuilding() {
    const name = document.getElementById('building-name').value.trim();
    const address = document.getElementById('building-address').value.trim();
    const description = document.getElementById('building-desc').value.trim();

    if (!name || !address) {
        showNotification('Name and address must not be empty!', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/buildings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address, description })
        });

        if (!res.ok) {
            const error = await res.json();
            showNotification('Error creating building: ' + (error.error || 'Unknown'), 'error');
            return;
        }

        // Clear input fields
        document.getElementById('building-name').value = '';
        document.getElementById('building-address').value = '';
        document.getElementById('building-desc').value = '';

        await fetchBuildings();
        await fetchBuildingsForTimetable();
        showNotification(`Building "${name}" created successfully!`, 'success');

    } catch (err) {
        console.error(err);
        showNotification('Error creating building: ' + err.message, 'error');
    }
}

async function deleteBuilding(id) {
    if (!confirm('Warning! This building and all related rooms and bookings will be deleted. Continue?')) return;

    try {
        const res = await fetch(`${API}/buildings/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const error = await res.json();
            showNotification('Error deleting building: ' + (error.error || 'Unknown error'), 'error');
            return;
        }

        await fetchBuildings();
        await fetchRooms();
        await fetchTimetable();
        await fetchBuildingsForTimetable();

        showNotification('Building deleted successfully!', 'success');

    } catch (err) {
        console.error(err);
        showNotification('Error deleting building: ' + err.message, 'error');
    }
}

function updateBuilding(id) {
    const building = window.buildings.find(b => b.id === id);
    if (!building) return;

    const form = document.getElementById('building-form');
    const formTitle = document.getElementById('building-form-title');
    const originalHTML = form.innerHTML;

    formTitle.textContent = `Edit building: ${building.name}`;
    form.innerHTML = `
        <input type="text" id="building-name-edit" value="${building.name}">
        <input type="text" id="building-address-edit" value="${building.address}">
        <input type="text" id="building-desc-edit" value="${building.description}">
        <button id="save-building-btn">Save</button>
        <button id="cancel-building-btn">Cancel</button>
    `;

    document.getElementById('save-building-btn').onclick = async () => {
        const name = document.getElementById('building-name-edit').value.trim();
        const address = document.getElementById('building-address-edit').value.trim();
        const description = document.getElementById('building-desc-edit').value.trim();

        if (!name || !address) {
            showNotification('Name and address cannot be empty!', 'error');
            return;
        }

        if (window.buildings.some(b => b.name === name && b.address === address && b.id !== id)) {
            showNotification('Building with this name and address already exists!', 'error');
            return;
        }

        try {
            const res = await fetch(`${API}/buildings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, address, description })
            });
            if (!res.ok) {
                const error = await res.json();
                showNotification('Error updating building: ' + (error.error || 'Unknown'), 'error');
                return;
            }

            await fetchBuildings();
            formTitle.textContent = 'Add new building';
            form.innerHTML = originalHTML;
            showNotification(`Building "${name}" updated!`, 'success');
        } catch (err) {
            console.error(err);
            showNotification('Error updating building: ' + err.message, 'error');
        }
    };

    document.getElementById('cancel-building-btn').onclick = () => {
        formTitle.textContent = 'Add new building';
        form.innerHTML = originalHTML;
    };
}



// --- Räume ---
async function fetchRooms() {
    try {
        const resRooms = await fetch(`${API}/rooms`);
        const roomsData = await resRooms.json();
        window.rooms = roomsData; // <-- WICHTIG

        const resBuildings = await fetch(`${API}/buildings`);
        const buildings = await resBuildings.json();
        window.buildings = buildings; // optional, falls du sie brauchst

        const list = document.getElementById('room-list');
        list.innerHTML = '';

        if (roomsData.length === 0) {
            list.innerHTML = '<li class="empty-text">No rooms available</li>';
            return;
        }

        roomsData.forEach(r => {
            const building = buildings.find(b => b.id === r.building_id);
            const buildingLabel = building ? building.name : 'Unknown';
            list.innerHTML += `<li>
                <div>${buildingLabel}</div>
                <div>Room ${r.room_nr}, Floor ${r.floor}, Seats ${r.capacity}</div>
                <div class="buttons">
                    <button onclick="updateRoom(${r.id})">Edit</button>
                    <button onclick="deleteRoom(${r.id})">Delete</button>
                </div>
            </li>`;
        });

    } catch (err) {
        console.error(err);
        showNotification('Error fetching rooms: ' + err.message, 'error');
    }
}

async function createRoom() {
    const building_id = document.getElementById('room-building').value;
    const floor = document.getElementById('room-floor').value;
    const room_nr = document.getElementById('room-nr').value;
    const capacity = document.getElementById('room-capacity').value;
    const description = document.getElementById('room-desc').value;

    if (!building_id || !room_nr || !floor) {
        showNotification('Please provide building, room number, and floor!', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ building_id, floor, room_nr, capacity, description })
        });

        if (!res.ok) {
            const error = await res.json();
            showNotification('Error creating room: ' + (error.error || 'Unknown'), 'error');
            return;
        }

        document.getElementById('room-floor').value = '';
        document.getElementById('room-nr').value = '';
        document.getElementById('room-capacity').value = '';
        document.getElementById('room-desc').value = '';

        await fetchRooms();
        showNotification(`Room ${room_nr} created successfully!`, 'success');

    } catch (err) {
        console.error(err);
        showNotification('Error creating room: ' + err.message, 'error');
    }
}

async function deleteRoom(id) {
    if (!confirm('Warning! Room and all related bookings will be deleted. Continue?')) return;

    try {
        const res = await fetch(`${API}/rooms/${id}`, { method: 'DELETE' });

        if (!res.ok) {
            const error = await res.json();
            showNotification('Error deleting room: ' + (error.error || 'Unknown'), 'error');
            return;
        }

        await fetchRooms();
        await fetchTimetable();
        showNotification('Room deleted successfully!', 'success');

    } catch (err) {
        console.error(err);
        showNotification('Error deleting room: ' + err.message, 'error');
    }
}

function updateRoom(id) {
    const room = window.rooms.find(r => r.id === id);
    if (!room) return;

    const form = document.getElementById('room-form');
    const formTitle = document.getElementById('room-form-title');
    const originalHTML = form.innerHTML;

    formTitle.textContent = `Edit Room: ${room.room_nr}`;

    // Gebäude-Dropdown vorbereiten
    let buildingOptions = window.buildings.map(b =>
        `<option value="${b.id}" ${b.id === room.building_id ? 'selected' : ''}>${b.name}</option>`
    ).join('');

    form.innerHTML = `
        <select id="room-building-edit">${buildingOptions}</select>
        <input type="text" id="room-floor-edit" value="${room.floor}">
        <input type="text" id="room-nr-edit" value="${room.room_nr}">
        <input type="text" id="room-capacity-edit" value="${room.capacity}">
        <input type="text" id="room-desc-edit" value="${room.description}">
        <button id="save-room-btn">Save</button>
        <button id="cancel-room-btn">Cancel</button>
    `;

    // Save-Button
    document.getElementById('save-room-btn').onclick = async () => {
        const building_id = document.getElementById('room-building-edit').value;
        const floor = document.getElementById('room-floor-edit').value.trim();
        const room_nr = document.getElementById('room-nr-edit').value.trim();
        const capacity = document.getElementById('room-capacity-edit').value.trim();
        const description = document.getElementById('room-desc-edit').value.trim();

        if (!building_id || !floor || !room_nr) {
            showNotification('Please fill required fields!', 'error');
            return;
        }

        try {
            const res = await fetch(`${API}/rooms/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ building_id, floor, room_nr, capacity, description })
            });
            if (!res.ok) {
                const error = await res.json();
                showNotification('Error updating room: ' + (error.error || 'Unknown'), 'error');
                return;
            }

            // --- Wichtig: alle Daten neu laden ---
            await fetchRooms();                  // Räume aktualisieren
            await fetchTimetable();              // Timetable aktualisieren
            await fetchBuildingsForTimetable();  // Dropdowns neu setzen

            // Formular zurücksetzen
            formTitle.textContent = 'Add new room';
            form.innerHTML = originalHTML;

            showNotification(`Room "${room_nr}" updated!`, 'success');
        } catch (err) {
            console.error(err);
            showNotification('Error updating room: ' + err.message, 'error');
        }
    };

    // Cancel-Button
    document.getElementById('cancel-room-btn').onclick = () => {
        formTitle.textContent = 'Add new room';
        form.innerHTML = originalHTML;
    };
}


// --- Lehrer ---
async function fetchTeachers() {
    try {
        const res = await fetch(`${API}/teachers`);
        const teachers = await res.json();
        window.teachers = teachers;

        const list = document.getElementById('teacher-list');
        const select = document.getElementById('tt-teacher');
        if (!list || !select) return;

        list.innerHTML = '';
        select.innerHTML = '<option value="">-- Please select teacher --</option>';

        if (teachers.length === 0) {
            list.innerHTML = '<li class="empty-text">No teachers available</li>';
        }

        teachers.forEach(t => {
            list.innerHTML += `<li>
                <div>${t.first_name} ${t.last_name}</div>
                <div>${t.email}</div>
                <div class="buttons">
                    <button onclick="updateTeacher(${t.id})">Edit</button>
                    <button onclick="deleteTeacher(${t.id})">Delete</button>
                </div>
            </li>`;

            select.innerHTML += `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`;
        });

    } catch (err) {
        console.error(err);
        showNotification('Error loading teachers: ' + err.message, 'error');
    }
}

async function createTeacher() {
    const first_name = document.getElementById('teacher-first').value.trim();
    const last_name = document.getElementById('teacher-last').value.trim();
    const email = document.getElementById('teacher-email').value.trim();

    if (!first_name || !last_name || !email) {
        showNotification('Please fill all fields!', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, email })
        });

        if (!res.ok) {
            const error = await res.json();
            showNotification('Error creating teacher: ' + (error.error || 'Unknown'), 'error');
            return;
        }

        // Clear input fields
        document.getElementById('teacher-first').value = '';
        document.getElementById('teacher-last').value = '';
        document.getElementById('teacher-email').value = '';

        await fetchTeachers();
        showNotification(`Teacher "${first_name} ${last_name}" created successfully!`, 'success');

    } catch (err) {
        console.error(err);
        showNotification('Error creating teacher: ' + err.message, 'error');
    }
}

async function deleteTeacher(id) {
    if (!confirm('Warning! Teacher and all related bookings will be deleted. Continue?')) return;

    try {
        const res = await fetch(`${API}/teachers/${id}`, { method: 'DELETE' });

        if (!res.ok) {
            const error = await res.json();
            showNotification('Error deleting teacher: ' + (error.error || 'Unknown'), 'error');
            return;
        }

        await fetchTeachers();
        await fetchTimetable();
        showNotification('Teacher deleted successfully!', 'success');

    } catch (err) {
        console.error(err);
        showNotification('Error deleting teacher: ' + err.message, 'error');
    }
}

function updateTeacher(id) {
    const teacher = window.teachers.find(t => t.id === id);
    if (!teacher) return;

    const form = document.getElementById('teacher-form');
    const formTitle = document.getElementById('teacher-form-title');
    const originalHTML = form.innerHTML;

    formTitle.textContent = `Edit teacher: ${teacher.first_name} ${teacher.last_name}`;
    form.innerHTML = `
        <input type="text" id="teacher-first-edit" value="${teacher.first_name}">
        <input type="text" id="teacher-last-edit" value="${teacher.last_name}">
        <input type="email" id="teacher-email-edit" value="${teacher.email}">
        <button id="save-teacher-btn">Save</button>
        <button id="cancel-teacher-btn">Cancel</button>
    `;

    document.getElementById('save-teacher-btn').onclick = async () => {
        const first_name = document.getElementById('teacher-first-edit').value.trim();
        const last_name = document.getElementById('teacher-last-edit').value.trim();
        const email = document.getElementById('teacher-email-edit').value.trim();

        if (!first_name || !last_name || !email) {
            showNotification('Please fill all fields!', 'error');
            return;
        }

        if (window.teachers.some(t => t.email === email && t.id !== id)) {
            showNotification('Teacher with this email already exists!', 'error');
            return;
        }

        try {
            const res = await fetch(`${API}/teachers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ first_name, last_name, email })
            });
            if (!res.ok) {
                const error = await res.json();
                showNotification('Error updating teacher: ' + (error.error || 'Unknown'), 'error');
                return;
            }

            await fetchTeachers();
            formTitle.textContent = 'Add new teacher';
            form.innerHTML = originalHTML;
            showNotification(`Teacher "${first_name} ${last_name}" updated!`, 'success');
        } catch (err) {
            console.error(err);
            showNotification('Error updating teacher: ' + err.message, 'error');
        }
    };

    document.getElementById('cancel-teacher-btn').onclick = () => {
        formTitle.textContent = 'Add new teacher';
        form.innerHTML = originalHTML;
    };
}




// --- Belegungen ---
async function fetchTimetable() {
    try {
        const res = await fetch(`${API}/timetable`);
        const tts = await res.json();
        window.timetable = tts;

        const list = document.getElementById('timetable-list');

        // 🔹 Liste immer sauber leeren
        list.innerHTML = '';
        if (!tts.length) {
            setEmpty(list, 'No bookings available');
            return;
        }

        // Räume und Gebäude einmal laden
        const rooms = window.rooms || [];
        const buildings = window.buildings || [];

        const fragment = document.createDocumentFragment();

        tts.forEach(tt => {
            const room = rooms.find(r => r.id === tt.room_id);
            const building = buildings.find(b => b.id === room?.building_id);
            const buildingLabel = building ? building.name : 'Unknown';
            const teacher = window.teachers.find(t => t.id === tt.teacher_id);
            const teacherLabel = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown';

            const start = formatDateTime(tt.start_time);
            const end = formatDateTime(tt.end_time);

            const li = document.createElement('li');
            li.innerHTML = `
    <div class="col description">${tt.description}</div>
    <div class="col location">${buildingLabel} - Room ${room ? room.room_nr : 'Unknown'}, Floor ${room ? room.floor : 'Unknown'}</div>
    <div class="col times">From: ${start}<br>To: ${end}</div>
    <div class="col buttons">
        <button onclick="updateTimetable(${tt.id})">Edit</button>
        <button onclick="deleteTimetable(${tt.id})">Delete</button>
    </div>
`;
            fragment.appendChild(li);
        });

        list.appendChild(fragment);

    } catch (err) {
        console.error(err);
        showNotification('Error fetching timetable: ' + err.message, 'error');
    }
}

async function createTimetable() {
    const room_id = document.getElementById('tt-room').value;
    const teacher_id = document.getElementById('tt-teacher').value;
    const start_time = document.getElementById('tt-start').value;
    const end_time = document.getElementById('tt-end').value;
    const description = document.getElementById('tt-desc').value.trim();

    if (!room_id || !teacher_id || !start_time || !end_time) {
        showNotification('Please fill all fields!', 'error');
        return;
    }

    if (new Date(start_time) >= new Date(end_time)) {
        showNotification('Start time must be before end time!', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/timetable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id, teacher_id, start_time, end_time, description })
        });

        if (!res.ok) {
            const error = await res.json();
            showNotification('Error creating booking: ' + (error.error || 'Unknown'), 'error');
            return;
        }

        showNotification('Booking created successfully!', 'success');
        await fetchTimetable();

    } catch (err) {
        console.error(err);
        showNotification('Error creating booking: ' + err.message, 'error');
    }
}

async function deleteTimetable(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
        const res = await fetch(`${API}/timetable/${id}`, { method: 'DELETE' });

        if (!res.ok) {
            const error = await res.json();
            showNotification('Error deleting booking: ' + (error.error || 'Unknown'), 'error');
            return;
        }

        await fetchTimetable();
        showNotification('Booking deleted successfully!', 'success');

    } catch (err) {
        console.error(err);
        showNotification('Error deleting booking: ' + err.message, 'error');
    }
}

async function updateTimetable(id) {
    const tt = window.timetable.find(t => t.id === id);
    if (!tt) return;

    const formRow = document.getElementById('timetable-form');
    const formTitle = document.getElementById('timetable-form-title');

    formTitle.textContent = `Edit Booking`;

    // Lehrer-Dropdown
    const teacherOptions = window.teachers.map(t =>
        `<option value="${t.id}" ${t.id === tt.teacher_id ? 'selected' : ''}>${t.first_name} ${t.last_name}</option>`
    ).join('');

    // Finde das Gebäude vom Raum
    const room = window.rooms.find(r => r.id === tt.room_id);
    const buildingId = room?.building_id || '';

    // Gebäude-Dropdown
    const buildingOptions = window.buildings.map(b =>
        `<option value="${b.id}" ${b.id === buildingId ? 'selected' : ''}>${b.name} (${b.address})</option>`
    ).join('');

    formRow.innerHTML = `
        <select id="tt-building-edit">${buildingOptions}</select>
        <select id="tt-room-edit"></select>
        <select id="tt-teacher-edit">${teacherOptions}</select>
        <input type="datetime-local" id="tt-start-edit" value="${tt.start_time.slice(0, 16)}">
        <input type="datetime-local" id="tt-end-edit" value="${tt.end_time.slice(0, 16)}">
        <input type="text" id="tt-desc-edit" value="${tt.description}">
        <button id="save-tt-btn">Save</button>
        <button id="cancel-tt-btn">Cancel</button>
    `;

    // Räume laden
    const loadRooms = async () => {
        const buildingId = document.getElementById('tt-building-edit').value;
        const roomSelect = document.getElementById('tt-room-edit');
        roomSelect.innerHTML = '';

        const rooms = window.rooms.filter(r => r.building_id == buildingId);
        rooms.forEach(r => {
            roomSelect.innerHTML += `<option value="${r.id}" ${r.id === tt.room_id ? 'selected' : ''}>
                Room ${r.room_nr} (Floor ${r.floor})
            </option>`;
        });
    };

    await loadRooms();
    document.getElementById('tt-building-edit').onchange = loadRooms;

    // Save
    document.getElementById('save-tt-btn').onclick = async () => {
        const room_id = document.getElementById('tt-room-edit').value;
        const teacher_id = document.getElementById('tt-teacher-edit').value;
        const start_time = document.getElementById('tt-start-edit').value;
        const end_time = document.getElementById('tt-end-edit').value;
        const description = document.getElementById('tt-desc-edit').value.trim();

        if (!room_id || !teacher_id || !start_time || !end_time) {
            showNotification('Please fill all fields!', 'error');
            return;
        }

        try {
            const res = await fetch(`${API}/timetable/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id, teacher_id, start_time, end_time, description })
            });

            if (!res.ok) {
                const error = await res.json();
                showNotification('Error updating booking: ' + (error.error || 'Unknown'), 'error');
                return;
            }

            await fetchTimetable(); // Liste neu laden
            formTitle.textContent = 'Add new booking';

            // Formular zurücksetzen
            formRow.innerHTML = `
                <select id="tt-building" onchange="loadRoomsForTimetable()">
                    <option value="">Select building first</option>
                </select>
                <select id="tt-room"><option value="">Select room</option></select>
                <select id="tt-teacher"><option value="">Select teacher</option></select>
                <input type="datetime-local" id="tt-start">
                <input type="datetime-local" id="tt-end">
                <input type="text" id="tt-desc" placeholder="Description">
                <button onclick="createTimetable()">Add booking</button>
            `;
            await fetchBuildingsForTimetable();
            await fetchTeachers();
        } catch (err) {
            console.error(err);
            showNotification('Error updating booking: ' + err.message, 'error');
        }
    };

    // Cancel
    document.getElementById('cancel-tt-btn').onclick = () => {
        formTitle.textContent = 'Add new booking';
        formRow.innerHTML = `
            <select id="tt-building" onchange="loadRoomsForTimetable()">
                <option value="">Select building first</option>
            </select>
            <select id="tt-room"><option value="">Select room</option></select>
            <select id="tt-teacher"><option value="">Select teacher</option></select>
            <input type="datetime-local" id="tt-start">
            <input type="datetime-local" id="tt-end">
            <input type="text" id="tt-desc" placeholder="Description">
            <button onclick="createTimetable()">Add booking</button>
        `;
        fetchBuildingsForTimetable();
        fetchTeachers();
    };
}

async function loadRoomsForTimetable() {
    const buildingId = document.getElementById('tt-building').value;
    const roomSelect = document.getElementById('tt-room');
    roomSelect.innerHTML = '<option value="">-- Select room --</option>';

    if (!buildingId) {
        roomSelect.innerHTML = '<option value="">-- Select building first --</option>';
        return;
    }

    try {
        const res = await fetch(`${API}/rooms/by-building/${buildingId}`);
        const rooms = await res.json();

        const resBuildings = await fetch(`${API}/buildings`);
        const buildings = await resBuildings.json();
        const building = buildings.find(b => b.id == buildingId);
        const buildingLabel = building ? `${building.name} (${building.address})` : 'Unknown';

        rooms.forEach(r => {
            roomSelect.innerHTML += `<option value="${r.id}">
                ${buildingLabel} - Room ${r.room_nr} (Floor ${r.floor})
            </option>`;
        });

    } catch (err) {
        console.error(err);
        showNotification('Error loading rooms: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchBuildings();    // Buildings zuerst
    await fetchRooms();        // Rooms danach
    await fetchTeachers();     // Teachers
    await fetchTimetable();    // Timetable zuletzt
});

// --- Initial Load ---
async function init() {
    await fetchBuildings();
    await fetchRooms();
    await fetchTeachers();
    await fetchTimetable();       // <-- timetable füllen
    await fetchBuildingsForTimetable();
}
init();
