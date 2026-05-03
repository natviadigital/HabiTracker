/* ========================================
   HabiTracker - Application Logic
   ======================================== */

// Supabase Configuration
const SUPABASE_URL = 'https://qzbmdqnwgoihzjxanpbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Ym1kcW53Z29paHpqeGFucGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODA4OTIsImV4cCI6MjA4Mzc1Njg5Mn0.Zah-Wtu5BGMM9KSDT4d00avcZ1ioY4OxcGOG7FPx9o4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Separate month-date state per calendar view
const calendarDates = {
    diet: new Date(),
    exercise: new Date(),
    summary: new Date()
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Modal state
let modalCurrentDate = null;

/* ========================================
   Initialization
   ======================================== */
async function init() {
    // Set today in register form
    const today = formatDate(new Date());
    const selectedDateInput = document.getElementById('selectedDate');
    selectedDateInput.value = today;
    updateRegisterDateLabel(today);
    await loadDataForDate(today);

    // Render all three calendars
    await Promise.all([
        renderCalendar('diet'),
        renderCalendar('exercise'),
        renderCalendar('summary')
    ]);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Register form events
    document.getElementById('saveBtn').addEventListener('click', saveProgress);
    selectedDateInput.addEventListener('change', async (e) => {
        updateRegisterDateLabel(e.target.value);
        await loadDataForDate(e.target.value);
    });

    // Calendar navigation buttons
    document.getElementById('prevMonthDiet').addEventListener('click', () => navigateMonth('diet', -1));
    document.getElementById('nextMonthDiet').addEventListener('click', () => navigateMonth('diet', 1));
    document.getElementById('prevMonthExercise').addEventListener('click', () => navigateMonth('exercise', -1));
    document.getElementById('nextMonthExercise').addEventListener('click', () => navigateMonth('exercise', 1));
    document.getElementById('prevMonthSummary').addEventListener('click', () => navigateMonth('summary', -1));
    document.getElementById('nextMonthSummary').addEventListener('click', () => navigateMonth('summary', 1));

    // Modal events
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('modalSaveBtn').addEventListener('click', saveModalProgress);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeEditModal();
    });
}

/* ========================================
   View Switching
   ======================================== */
function switchView(viewName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const active = btn.dataset.view === viewName;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active);
    });
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('hidden', view.id !== `view-${viewName}`);
    });
}

/* ========================================
   Date Utilities
   ======================================== */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return `${DAY_NAMES[date.getDay()]}, ${day} de ${MONTHS[month - 1]} de ${year}`;
}

function updateRegisterDateLabel(dateStr) {
    const el = document.getElementById('currentDate');
    if (dateStr && el) el.textContent = formatDateDisplay(dateStr);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ========================================
   Supabase Data Operations
   ======================================== */
async function loadDataForDate(dateStr) {
    if (!dateStr) return;
    try {
        const { data, error } = await supabase
            .from('habit_logs').select('*').eq('date', dateStr).single();

        if (error && error.code !== 'PGRST116') { console.error(error); return; }

        document.getElementById('dietCheckbox').checked = data?.diet_completed || false;
        document.getElementById('exerciseCheckbox').checked = data?.exercise_completed || false;
    } catch (err) {
        console.error('Exception loading data:', err);
    }
}

async function loadMonthData(year, month) {
    const startDate = formatDate(new Date(year, month, 1));
    const endDate = formatDate(new Date(year, month + 1, 0));
    try {
        const { data, error } = await supabase
            .from('habit_logs').select('*').gte('date', startDate).lte('date', endDate);
        if (error) { console.error(error); return {}; }
        const map = {};
        (data || []).forEach(item => { map[item.date] = item; });
        return map;
    } catch (err) {
        console.error(err);
        return {};
    }
}

async function saveDataForDate(dateStr, dietCompleted, exerciseCompleted) {
    try {
        const { error } = await supabase.from('habit_logs').upsert({
            date: dateStr,
            diet_completed: dietCompleted,
            exercise_completed: exerciseCompleted,
            updated_at: new Date().toISOString()
        }, { onConflict: 'date' });

        if (error) { showToast('Error al guardar progreso', 'error'); return false; }
        showToast('¡Progreso guardado exitosamente!', 'success');
        return true;
    } catch (err) {
        showToast('Error al guardar progreso', 'error');
        return false;
    }
}

async function refreshAllCalendars() {
    await Promise.all([
        renderCalendar('diet'),
        renderCalendar('exercise'),
        renderCalendar('summary')
    ]);
}

/* ========================================
   Register Form Save
   ======================================== */
async function saveProgress() {
    const dateStr = document.getElementById('selectedDate').value;
    if (!dateStr) { showToast('Por favor selecciona una fecha', 'error'); return; }
    const success = await saveDataForDate(
        dateStr,
        document.getElementById('dietCheckbox').checked,
        document.getElementById('exerciseCheckbox').checked
    );
    if (success) await refreshAllCalendars();
}

/* ========================================
   Calendar Rendering
   ======================================== */
async function renderCalendar(mode) {
    const date = calendarDates[mode];
    const year = date.getFullYear();
    const month = date.getMonth();

    document.getElementById(`calendarTitle${capitalize(mode)}`).textContent = `${MONTHS[month]} ${year}`;

    const monthData = await loadMonthData(year, month);
    const gridEl = document.getElementById(`calendarGrid${capitalize(mode)}`);
    gridEl.innerHTML = '';

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const todayStr = formatDate(new Date());

    // Previous month trailing days (non-interactive)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        gridEl.appendChild(createDayElement(prevMonthLastDay - i, 'other-month', null));
    }

    // Current month days
    for (let day = 1; day <= numDays; day++) {
        const dateStr = formatDate(new Date(year, month, day));
        const dayData = monthData[dateStr];
        let classes = getColorClass(mode, dayData);
        if (dateStr === todayStr) classes += ' today';
        gridEl.appendChild(createDayElement(day, classes, dateStr));
    }

    // Next month leading days (non-interactive)
    const remaining = 42 - gridEl.children.length;
    for (let day = 1; day <= remaining; day++) {
        gridEl.appendChild(createDayElement(day, 'other-month', null));
    }
}

function createDayElement(day, className, dateStr) {
    const el = document.createElement('div');
    el.className = `calendar-day ${className}`;
    el.textContent = day;
    if (dateStr) {
        el.dataset.date = dateStr;
        el.title = 'Clic para editar';
        el.addEventListener('click', () => openEditModal(dateStr));
    } else {
        el.style.cursor = 'default';
        el.style.pointerEvents = 'none';
    }
    return el;
}

/* ========================================
   Color Class Logic
   ======================================== */
function getColorClass(mode, dayData) {
    if (!dayData) return 'no-data';

    if (mode === 'diet') {
        return dayData.diet_completed ? 'success' : 'fail';
    }
    if (mode === 'exercise') {
        return dayData.exercise_completed ? 'success' : 'fail';
    }
    // summary
    const { diet_completed, exercise_completed } = dayData;
    if (diet_completed && exercise_completed) return 'success';
    if (diet_completed || exercise_completed) return 'partial';
    return 'fail';
}

/* ========================================
   Calendar Navigation
   ======================================== */
function navigateMonth(mode, direction) {
    calendarDates[mode].setMonth(calendarDates[mode].getMonth() + direction);
    renderCalendar(mode);
}

/* ========================================
   Edit Day Modal
   ======================================== */
async function openEditModal(dateStr) {
    modalCurrentDate = dateStr;
    document.getElementById('modalDateLabel').textContent = formatDateDisplay(dateStr);

    try {
        const { data, error } = await supabase
            .from('habit_logs').select('*').eq('date', dateStr).single();
        if (error && error.code !== 'PGRST116') console.error(error);
        document.getElementById('modalDietCheckbox').checked = data?.diet_completed || false;
        document.getElementById('modalExerciseCheckbox').checked = data?.exercise_completed || false;
    } catch (err) {
        document.getElementById('modalDietCheckbox').checked = false;
        document.getElementById('modalExerciseCheckbox').checked = false;
    }

    document.getElementById('editModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.body.style.overflow = '';
    modalCurrentDate = null;
}

async function saveModalProgress() {
    if (!modalCurrentDate) return;
    const success = await saveDataForDate(
        modalCurrentDate,
        document.getElementById('modalDietCheckbox').checked,
        document.getElementById('modalExerciseCheckbox').checked
    );
    if (success) {
        closeEditModal();
        await refreshAllCalendars();
        // Sync register form if same date is selected
        const regDate = document.getElementById('selectedDate').value;
        if (regDate === modalCurrentDate) await loadDataForDate(modalCurrentDate);
    }
}

/* ========================================
   Toast Notifications
   ======================================== */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ========================================
   Start Application
   ======================================== */
document.addEventListener('DOMContentLoaded', init);
