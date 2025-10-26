const CALENDAR_API_URL = 'http://localhost:8080/lesson';

let currentWeekStart = null;
let allLessons = [];
let selectedCell = null;
let draggedLesson = null;

const SUBJECTS = ['Matek', 'Informatika', 'Fizika', 'Programozás'];

const DURATIONS = [];
for (let i = 1; i <= 3; i += 0.25) {
    DURATIONS.push(i);
}

function initializeCalendar() {
    currentWeekStart = getMonday(new Date());
    renderCalendar();
    loadLessons();
}

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const currentWeekDisplay = document.getElementById('current-week');

    if (!calendarGrid || !currentWeekDisplay) {
        console.error('Naptár elemek nem találhatók');
        return;
    }

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        weekDates.push(date);
    }

    const weekEnd = new Date(weekDates[6]);
    currentWeekDisplay.textContent = `${formatDate(weekDates[0])} - ${formatDate(weekEnd)}`;

    let gridHTML = '';

    // Fejléc
    gridHTML += '<div class="calendar-day-header time-header">Időpont</div>';
    const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    weekDates.forEach((date, index) => {
        gridHTML += `
            <div class="calendar-day-header">
                ${dayNames[index]}<br>
                <small>${date.getMonth() + 1}/${date.getDate()}</small>
            </div>
        `;
    });

    // Idősorok (8:00 - 20:00, 15 perces bontás)
    for (let hour = 8; hour <= 19; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const startTime = `${hour}.${String(minute).padStart(2, '0')}`;
            const endMinute = minute + 15;
            const endHour = endMinute >= 60 ? hour + 1 : hour;
            const endMin = endMinute >= 60 ? 0 : endMinute;
            const endTime = `${endHour}.${String(endMin).padStart(2, '0')}`;
            const timeRange = `${startTime}-${endTime}`;

            gridHTML += `<div class="calendar-time-slot">${timeRange}</div>`;

            weekDates.forEach(date => {
                const cellDate = new Date(date);
                cellDate.setHours(hour, minute, 0, 0);
                const cellId = `cell-${cellDate.getTime()}`;

                gridHTML += `
                    <div class="calendar-cell" 
                         id="${cellId}" 
                         data-datetime="${cellDate.toISOString()}"
                         onclick="handleCellClick('${cellId}', '${cellDate.toISOString()}')"
                         ondragover="handleDragOver(event, '${cellId}')"
                         ondragleave="handleDragLeave(event, '${cellId}')"
                         ondrop="handleDrop(event, '${cellId}', '${cellDate.toISOString()}')">
                    </div>
                `;
            });
        }
    }

    calendarGrid.innerHTML = gridHTML;
    console.log('Naptár renderelve');
}

async function loadLessons() {
    try {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);

        const startDate = formatDateISO(currentWeekStart);
        const endDate = formatDateISO(weekEnd);

        console.log('Órák lekérése:', startDate, '-', endDate);

        const response = await fetch(`${CALENDAR_API_URL}/calendar?startDate=${startDate}&endDate=${endDate}`);

        if (response.ok) {
            allLessons = await response.json();
            console.log('Betöltött órák:', allLessons);
            displayLessons();
        } else {
            console.error('Hiba az órák betöltése során:', response.status);
            showNotification('Hiba az órák betöltése során!', 'error');
        }
    } catch (error) {
        console.error('Hálózati hiba:', error);
        showNotification('Hálózati hiba!', 'error');
    }
}

function displayLessons() {
    document.querySelectorAll('.calendar-cell').forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('has-lesson');
    });

    console.log('Órák megjelenítése, összesen:', allLessons.length);

    allLessons.forEach((lesson, index) => {
        if (!lesson.date) {
            console.warn(`Óra #${index} dátum hiányzik:`, lesson);
            return;
        }

        let lessonDate;
        try {
            if (Array.isArray(lesson.date)) {
                lessonDate = new Date(
                    lesson.date[0],
                    lesson.date[1] - 1,
                    lesson.date[2],
                    lesson.date[3] || 0,
                    lesson.date[4] || 0,
                    0,
                    0
                );
            } else if (typeof lesson.date === 'string') {
                lessonDate = new Date(lesson.date);
            } else {
                console.error(`Óra #${index} ismeretlen dátum formátum:`, lesson.date);
                return;
            }

            if (isNaN(lessonDate.getTime())) {
                console.error(`Óra #${index} érvénytelen dátum:`, lesson.date);
                return;
            }

        } catch (error) {
            console.error(`Óra #${index} dátum konverziós hiba:`, error, lesson.date);
            return;
        }

        const minutes = lessonDate.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        lessonDate.setMinutes(roundedMinutes);
        lessonDate.setSeconds(0);
        lessonDate.setMilliseconds(0);

        const cellId = `cell-${lessonDate.getTime()}`;
        const cell = document.getElementById(cellId);

        if (cell) {
            const duration = lesson.duration || 1;
            const heightInPixels = (duration * 60 / 15) * 20;

            cell.classList.add('has-lesson');
            cell.innerHTML = createLessonCard(lesson, heightInPixels);

            console.log(`✅ Óra #${index} hozzáadva:`, {
                cellId,
                height: heightInPixels,
                date: lessonDate.toLocaleString('hu-HU')
            });
        } else {
            console.error(`❌ Óra #${index} cellája nem található:`, {
                cellId,
                lessonDate: lessonDate.toISOString()
            });
        }
    });
}

// ✅ ÚJ FORMÁTUM: Kezdési időpont - Tanuló neve / Tantárgy - Időtartam óra
function createLessonCard(lesson, height) {
    const retainedClass = lesson.isRetained ? 'retained' : '';
    const checkIcon = lesson.isRetained ? '✅' : '☑️';

    let displayDate;
    try {
        if (Array.isArray(lesson.date)) {
            displayDate = new Date(
                lesson.date[0],
                lesson.date[1] - 1,
                lesson.date[2],
                lesson.date[3] || 0,
                lesson.date[4] || 0,
                0,
                0
            );
        } else {
            displayDate = new Date(lesson.date);
        }
    } catch {
        displayDate = new Date();
    }

    // ✅ JAVÍTOTT IDŐTARTAM FORMÁTUM
    const durationText = lesson.duration === 1
        ? '1 óra'
        : lesson.duration % 1 === 0
            ? `${lesson.duration} óra`
            : `${lesson.duration} óra`;

    return `
        <div class="lesson-card ${retainedClass}" 
             style="height: ${height}px; min-height: 50px;"
             draggable="true"
             ondragstart="handleDragStart(event, ${lesson.id})"
             ondragend="handleDragEnd(event)"
             ondblclick="editLesson(${lesson.id})">
            
            <div class="lesson-header">
                <span class="lesson-time">${formatTime(displayDate)}</span>
                <span class="lesson-separator">-</span>
                <span class="lesson-student">${escapeHtml(lesson.studentName || 'Ismeretlen')}</span>
            </div>
            
            <div class="lesson-details">
                <span class="lesson-subject">${escapeHtml(lesson.subject || '')}</span>
                <span class="lesson-separator">-</span>
                <span class="lesson-duration">${durationText}</span>
            </div>
            
            <div class="lesson-actions" onclick="event.stopPropagation()">
                <button class="action-btn btn-check" 
                        onclick="event.stopPropagation(); toggleRetain(${lesson.id}, ${!lesson.isRetained})"
                        title="${lesson.isRetained ? 'Megtartva' : 'Megtartás jelölése'}">
                    ${checkIcon}
                </button>
                <button class="action-btn btn-edit" 
                        onclick="event.stopPropagation(); editLesson(${lesson.id})"
                        title="Szerkesztés">
                    ✏️
                </button>
                <button class="action-btn btn-delete" 
                        onclick="event.stopPropagation(); deleteLesson(${lesson.id})"
                        title="Törlés">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

function handleDragStart(event, lessonId) {
    draggedLesson = allLessons.find(l => l.id === lessonId);
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', lessonId);
    console.log('Húzás kezdődik:', draggedLesson);
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(cell => {
        cell.classList.remove('drag-over');
    });
}

function handleDragOver(event, cellId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const cell = document.getElementById(cellId);
    if (!cell.classList.contains('has-lesson')) {
        cell.classList.add('drag-over');
    }
}

function handleDragLeave(event, cellId) {
    const cell = document.getElementById(cellId);
    cell.classList.remove('drag-over');
}

async function handleDrop(event, cellId, newDatetime) {
    event.preventDefault();
    event.stopPropagation();

    const cell = document.getElementById(cellId);
    cell.classList.remove('drag-over');

    if (!draggedLesson || cell.classList.contains('has-lesson')) {
        draggedLesson = null;
        return;
    }

    const newDate = new Date(newDatetime);

    const updatedLesson = {
        studentName: draggedLesson.studentName,
        partnerName: draggedLesson.partnerName,
        subject: draggedLesson.subject,
        duration: draggedLesson.duration,
        type: draggedLesson.type,
        date: formatDateTimeForBackend(newDate),
        isRetained: draggedLesson.isRetained || false
    };

    console.log('Óra áthelyezése:', updatedLesson);

    try {
        const response = await fetch(`${CALENDAR_API_URL}/${draggedLesson.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedLesson)
        });

        if (response.ok) {
            draggedLesson = null;
            await loadLessons();
            showNotification('Óra sikeresen áthelyezve!', 'success');
        } else {
            const errorText = await response.text();
            console.error('Hiba:', errorText);
            showNotification('Hiba: ' + errorText, 'error');
        }
    } catch (error) {
        console.error('Hiba:', error);
        showNotification('Hálózati hiba!', 'error');
    }
}

function handleCellClick(cellId, datetime) {
    const cell = document.getElementById(cellId);

    if (cell.classList.contains('has-lesson')) {
        return;
    }

    selectedCell = { cellId, datetime };
    openLessonModal(datetime);
}

async function openLessonModal(datetime, lessonData = null) {
    const modal = document.getElementById('lesson-modal');
    const modalTitle = document.getElementById('modal-title');
    const selectedDatetime = document.getElementById('selected-datetime');

    let date;
    if (lessonData && lessonData.date) {
        if (Array.isArray(lessonData.date)) {
            date = new Date(
                lessonData.date[0],
                lessonData.date[1] - 1,
                lessonData.date[2],
                lessonData.date[3] || 0,
                lessonData.date[4] || 0,
                0,
                0
            );
        } else {
            date = new Date(lessonData.date);
        }
    } else {
        date = new Date(datetime);
    }

    if (lessonData) {
        modalTitle.textContent = '✏️ Óra szerkesztése';
        document.getElementById('lesson-id').value = lessonData.id;
        document.getElementById('lesson-is-retained').value = lessonData.isRetained ? 'true' : 'false';
        selectedCell = { datetime: date.toISOString() };

        document.getElementById('lesson-date').value = formatDateInput(date);
        document.getElementById('lesson-time').value = formatTime(date);
    } else {
        modalTitle.textContent = '➕ Új óra felvétele';
        document.getElementById('lesson-id').value = '';
        document.getElementById('lesson-is-retained').value = 'false';
        document.getElementById('lesson-date').value = formatDateInput(date);
        document.getElementById('lesson-time').value = formatTime(date);
    }

    selectedDatetime.innerHTML = `<strong>📅 ${formatDateTime(date)}</strong>`;

    const subjectSelect = document.getElementById('lesson-subject');
    subjectSelect.innerHTML = '<option value="">-- Válasszon tantárgyat --</option>';
    SUBJECTS.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        if (lessonData && lessonData.subject === subject) {
            option.selected = true;
        }
        subjectSelect.appendChild(option);
    });

    const durationSelect = document.getElementById('lesson-duration');
    durationSelect.innerHTML = '<option value="">-- Válasszon időtartamot --</option>';
    DURATIONS.forEach(duration => {
        const option = document.createElement('option');
        option.value = duration;
        option.textContent = `${duration} óra`;
        if (lessonData && lessonData.duration === duration) {
            option.selected = true;
        }
        durationSelect.appendChild(option);
    });

    await loadStudents();

    if (lessonData) {
        document.getElementById('lesson-student').value = lessonData.studentName;
        await loadPartnersByStudent(lessonData.studentName);
        document.getElementById('lesson-partner').value = lessonData.partnerName;
        document.getElementById('lesson-type').value = lessonData.type;
    }

    modal.classList.add('active');
}

async function loadStudents() {
    try {
        const response = await fetch(`${CALENDAR_API_URL}/students`);

        if (response.ok) {
            const students = await response.json();
            const studentSelect = document.getElementById('lesson-student');

            studentSelect.innerHTML = '<option value="">-- Válasszon tanulót --</option>';
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student;
                option.textContent = student;
                studentSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Hiba:', error);
    }
}

async function loadPartnersByStudent(studentName) {
    if (!studentName) {
        document.getElementById('lesson-partner').innerHTML = '<option value="">-- Először válasszon tanulót --</option>';
        return;
    }

    try {
        const response = await fetch(`${CALENDAR_API_URL}/partners-by-student?studentName=${encodeURIComponent(studentName)}`);

        if (response.ok) {
            const partners = await response.json();
            const partnerSelect = document.getElementById('lesson-partner');

            partnerSelect.innerHTML = '<option value="">-- Válasszon partnert --</option>';
            partners.forEach(partner => {
                const option = document.createElement('option');
                option.value = partner;
                option.textContent = partner;
                partnerSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Hiba:', error);
    }
}

function closeLessonModal() {
    const modal = document.getElementById('lesson-modal');
    modal.classList.remove('active');
    document.getElementById('lesson-form').reset();
    selectedCell = null;
}

async function saveLessonFromModal(event) {
    event.preventDefault();

    const form = event.target;
    const lessonId = document.getElementById('lesson-id').value;
    const formData = new FormData(form);

    const studentName = formData.get('studentName');
    const partnerName = formData.get('partnerName');
    const subject = formData.get('subject');
    const duration = parseFloat(formData.get('duration'));
    const type = formData.get('type');

    const dateInput = formData.get('date');
    const timeInput = formData.get('time');

    const [year, month, day] = dateInput.split('-').map(Number);
    const [hours, minutes] = timeInput.split(':').map(Number);
    const datetime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    const isRetainedValue = document.getElementById('lesson-is-retained').value === 'true';

    const lessonData = {
        studentName,
        partnerName,
        subject,
        duration,
        type,
        date: formatDateTimeForBackend(datetime),
        isRetained: lessonId ? isRetainedValue : false
    };

    console.log('Mentendő óra:', lessonData);

    try {
        let response;

        if (lessonId) {
            response = await fetch(`${CALENDAR_API_URL}/${lessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });
        } else {
            response = await fetch(`${CALENDAR_API_URL}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });
        }

        if (response.ok) {
            console.log('Sikeres mentés');
            closeLessonModal();
            await loadLessons();
            showNotification('Óra sikeresen mentve!', 'success');
        } else {
            const errorText = await response.text();
            console.error('Hiba:', errorText);
            showNotification('Hiba: ' + errorText, 'error');
        }
    } catch (error) {
        console.error('Hálózati hiba:', error);
        showNotification('Hálózati hiba!', 'error');
    }
}

async function toggleRetain(lessonId, newStatus) {
    try {
        const response = await fetch(`${CALENDAR_API_URL}/${lessonId}/retain`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRetained: newStatus })
        });

        if (response.ok) {
            await loadLessons();
            showNotification(newStatus ? 'Óra megtartva!' : 'Megtartás visszavonva!', 'success');
        }
    } catch (error) {
        console.error('Hiba:', error);
        showNotification('Hiba történt!', 'error');
    }
}

async function editLesson(lessonId) {
    const lesson = allLessons.find(l => l.id === lessonId);
    if (lesson) {
        openLessonModal(null, lesson);
    }
}

async function deleteLesson(lessonId) {
    if (!confirm('Biztosan törli ezt az órát?')) {
        return;
    }

    try {
        const response = await fetch(`${CALENDAR_API_URL}/${lessonId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadLessons();
            showNotification('Óra törölve!', 'success');
        }
    } catch (error) {
        console.error('Hiba:', error);
        showNotification('Hiba történt!', 'error');
    }
}

function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderCalendar();
    loadLessons();
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderCalendar();
    loadLessons();
}

function goToToday() {
    currentWeekStart = getMonday(new Date());
    renderCalendar();
    loadLessons();
}

function formatDateTimeForBackend(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

function formatDate(date) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDateTime(date) {
    return `${formatDate(date)} ${formatTime(date)}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        background: ${type === 'success' ? '#D1FAE5' : '#FEE2E2'};
        color: ${type === 'success' ? '#065F46' : '#991B1B'};
        font-weight: 600;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
