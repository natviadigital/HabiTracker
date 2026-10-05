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
    summary: new Date(),
    desmo: new Date()
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

    // Render all calendars
    await Promise.all([
        renderCalendar('diet'),
        renderCalendar('exercise'),
        renderCalendar('summary'),
        renderCalendar('desmo'),
        refreshDesmoQuick()
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
    document.getElementById('prevMonthDesmo').addEventListener('click', () => navigateMonth('desmo', -1));
    document.getElementById('nextMonthDesmo').addEventListener('click', () => navigateMonth('desmo', 1));

    // Modal events
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('modalSaveBtn').addEventListener('click', saveModalProgress);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeEditModal();
    });

    // Desmopresina events
    document.querySelectorAll('.desmo-quick .pill-btn').forEach(btn => {
        btn.addEventListener('click', () => quickLogDesmo(Number(btn.dataset.pills)));
    });
    document.querySelectorAll('#desmoModal .pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            desmoModalPills = Number(btn.dataset.pills);
            setPillSelection(document.getElementById('desmoModal'), desmoModalPills);
        });
    });
    document.getElementById('closeDesmoModal').addEventListener('click', closeDesmoModal);
    document.getElementById('desmoModalSaveBtn').addEventListener('click', () => saveDesmoModal(false));
    document.getElementById('desmoModalClearBtn').addEventListener('click', () => saveDesmoModal(true));
    document.getElementById('desmoModal').addEventListener('click', (e) => {
        if (e.target.id === 'desmoModal') closeDesmoModal();
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

async function loadDataRange(startDate, endDate, table = 'habit_logs') {
    try {
        const { data, error } = await supabase
            .from(table).select('*').gte('date', startDate).lte('date', endDate);
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

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const todayStr = formatDate(new Date());

    const remaining = 42 - (firstDayOfWeek + numDays);
    const startDateStr = formatDate(new Date(year, month, 1 - firstDayOfWeek));
    const endDateStr = formatDate(new Date(year, month + 1, remaining));

    const monthData = await loadDataRange(startDateStr, endDateStr, mode === 'desmo' ? 'desmo_logs' : 'habit_logs');
    const gridEl = document.getElementById(`calendarGrid${capitalize(mode)}`);
    gridEl.innerHTML = '';

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dateStr = formatDate(new Date(year, month - 1, prevMonthLastDay - i));
        const dayData = monthData[dateStr];
        let classes = getColorClass(mode, dayData) + ' other-month';
        gridEl.appendChild(createDayElement(prevMonthLastDay - i, classes, dateStr, mode));
    }

    // Current month days
    for (let day = 1; day <= numDays; day++) {
        const dateStr = formatDate(new Date(year, month, day));
        const dayData = monthData[dateStr];
        let classes = getColorClass(mode, dayData);
        if (dateStr === todayStr) classes += ' today';
        gridEl.appendChild(createDayElement(day, classes, dateStr, mode));
    }

    // Next month leading days
    for (let day = 1; day <= remaining; day++) {
        const dateStr = formatDate(new Date(year, month + 1, day));
        const dayData = monthData[dateStr];
        let classes = getColorClass(mode, dayData) + ' other-month';
        gridEl.appendChild(createDayElement(day, classes, dateStr, mode));
    }

    if (mode === 'desmo') renderDesmoStats(monthData, year, month);
}

function renderDesmoStats(monthData, year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    let two = 0, three = 0;
    Object.values(monthData).forEach(item => {
        if (!item.date.startsWith(prefix)) return;
        if (item.pills >= 3) three++;
        else if (item.pills === 2) two++;
    });
    const total = two + three;
    const pct = total ? Math.round((three / total) * 100) : 0;
    document.getElementById('desmoStats').innerHTML = total
        ? `🟢 <strong>${two}</strong> días con 2 · 🟠 <strong>${three}</strong> días con 3 (${pct}% de los días registrados)`
        : 'Sin registros este mes';
}

function createDayElement(day, className, dateStr, mode) {
    const el = document.createElement('div');
    el.className = `calendar-day ${className}`;
    el.textContent = day;
    if (dateStr) {
        el.dataset.date = dateStr;
        el.title = 'Clic para editar';
        el.addEventListener('click', () =>
            mode === 'desmo' ? openDesmoModal(dateStr) : openEditModal(dateStr));
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
    if (mode === 'desmo') {
        if (dayData.pills >= 3) return 'high';
        if (dayData.pills === 2) return 'success';
        return 'no-data';
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
   Desmopresina
   ======================================== */
let desmoModalDate = null;
let desmoModalPills = null;

async function getDesmoForDate(dateStr) {
    const { data, error } = await supabase
        .from('desmo_logs').select('pills').eq('date', dateStr).maybeSingle();
    if (error) { console.error(error); return null; }
    return data?.pills ?? null;
}

async function saveDesmo(dateStr, pills) {
    try {
        const { error } = pills
            ? await supabase.from('desmo_logs').upsert(
                { date: dateStr, pills, updated_at: new Date().toISOString() },
                { onConflict: 'date' })
            : await supabase.from('desmo_logs').delete().eq('date', dateStr);
        if (error) { console.error(error); showToast('Error al guardar desmopresina', 'error'); return false; }
        showToast(pills ? `💊 ${pills} pastillas registradas` : 'Registro borrado', 'success');
        return true;
    } catch (err) {
        console.error(err);
        showToast('Error al guardar desmopresina', 'error');
        return false;
    }
}

function setPillSelection(container, pills) {
    container.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.toggle('selected', Number(btn.dataset.pills) === pills);
    });
}

async function refreshDesmoQuick() {
    const pills = await getDesmoForDate(formatDate(new Date()));
    setPillSelection(document.querySelector('.desmo-quick'), pills);
}

async function quickLogDesmo(pills) {
    const today = formatDate(new Date());
    const current = await getDesmoForDate(today);
    // Tapping the already-selected option clears today's record
    const newValue = current === pills ? null : pills;
    if (await saveDesmo(today, newValue)) {
        setPillSelection(document.querySelector('.desmo-quick'), newValue);
        await renderCalendar('desmo');
    }
}

async function openDesmoModal(dateStr) {
    desmoModalDate = dateStr;
    document.getElementById('desmoModalDateLabel').textContent = formatDateDisplay(dateStr);
    desmoModalPills = await getDesmoForDate(dateStr);
    setPillSelection(document.getElementById('desmoModal'), desmoModalPills);
    document.getElementById('desmoModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDesmoModal() {
    document.getElementById('desmoModal').classList.add('hidden');
    document.body.style.overflow = '';
    desmoModalDate = null;
}

async function saveDesmoModal(clear = false) {
    if (!desmoModalDate) return;
    if (!clear && !desmoModalPills) { showToast('Selecciona 2 o 3 pastillas', 'error'); return; }
    if (await saveDesmo(desmoModalDate, clear ? null : desmoModalPills)) {
        closeDesmoModal();
        await Promise.all([renderCalendar('desmo'), refreshDesmoQuick()]);
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
