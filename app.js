/* ========================================
   HabiTracker - Application Logic
   ======================================== */

// Supabase Configuration
const SUPABASE_URL = 'https://qzbmdqnwgoihzjxanpbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Ym1kcW53Z29paHpqeGFucGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODA4OTIsImV4cCI6MjA4Mzc1Njg5Mn0.Zah-Wtu5BGMM9KSDT4d00avcZ1ioY4OxcGOG7FPx9o4';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application State
let currentDate = new Date();
let monthData = {};

// DOM Elements
const dietCheckbox = document.getElementById('dietCheckbox');
const exerciseCheckbox = document.getElementById('exerciseCheckbox');
const saveBtn = document.getElementById('saveBtn');
const calendarGrid = document.getElementById('calendarGrid');
const calendarTitle = document.getElementById('calendarTitle');
const currentDateEl = document.getElementById('currentDate');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const toast = document.getElementById('toast');

// Month names in Spanish
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/* ========================================
   Initialization
   ======================================== */
async function init() {
    // Set current date text
    updateCurrentDate();

    // Load today's data
    await loadTodayData();

    // Render calendar for current month
    await renderCalendar();

    // Event Listeners
    saveBtn.addEventListener('click', saveTodayProgress);
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));

    // Auto-save on checkbox change
    dietCheckbox.addEventListener('change', saveTodayProgress);
    exerciseCheckbox.addEventListener('change', saveTodayProgress);
}

/* ========================================
   Date Utilities
   ======================================== */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} de ${month} de ${year}`;
}

function updateCurrentDate() {
    currentDateEl.textContent = formatDateDisplay(new Date());
}

/* ========================================
   Supabase Data Operations
   ======================================== */
async function loadTodayData() {
    const today = formatDate(new Date());

    try {
        const { data, error } = await supabase
            .from('habit_logs')
            .select('*')
            .eq('date', today)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error loading today data:', error);
            return;
        }

        if (data) {
            dietCheckbox.checked = data.diet_completed;
            exerciseCheckbox.checked = data.exercise_completed;
        } else {
            dietCheckbox.checked = false;
            exerciseCheckbox.checked = false;
        }
    } catch (err) {
        console.error('Exception loading today data:', err);
        showToast('Error al cargar datos de hoy', 'error');
    }
}

async function loadMonthData(year, month) {
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = formatDate(firstDay);
    const endDate = formatDate(lastDay);

    try {
        const { data, error } = await supabase
            .from('habit_logs')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) {
            console.error('Error loading month data:', error);
            showToast('Error al cargar datos del mes', 'error');
            return {};
        }

        // Convert array to object with date as key
        const dataMap = {};
        if (data) {
            data.forEach(item => {
                dataMap[item.date] = item;
            });
        }

        return dataMap;
    } catch (err) {
        console.error('Exception loading month data:', err);
        showToast('Error al cargar datos del mes', 'error');
        return {};
    }
}

async function saveTodayProgress() {
    const today = formatDate(new Date());
    const dietCompleted = dietCheckbox.checked;
    const exerciseCompleted = exerciseCheckbox.checked;

    try {
        const { data, error } = await supabase
            .from('habit_logs')
            .upsert({
                date: today,
                diet_completed: dietCompleted,
                exercise_completed: exerciseCompleted,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'date'
            });

        if (error) {
            console.error('Error saving progress:', error);
            showToast('Error al guardar progreso', 'error');
            return;
        }

        showToast('¡Progreso guardado exitosamente!', 'success');

        // Refresh calendar to show updated data
        await renderCalendar();
    } catch (err) {
        console.error('Exception saving progress:', err);
        showToast('Error al guardar progreso', 'error');
    }
}

/* ========================================
   Calendar Rendering
   ======================================== */
async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update title
    calendarTitle.textContent = `${MONTHS[month]} ${year}`;

    // Load month data from Supabase
    monthData = await loadMonthData(year, month);

    // Clear calendar
    calendarGrid.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = startDayOfWeek;

    // Render previous month's trailing days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayEl = createDayElement(day, 'other-month empty-day');
        calendarGrid.appendChild(dayEl);
    }

    // Render current month's days
    const today = new Date();
    const todayStr = formatDate(today);

    for (let day = 1; day <= numDays; day++) {
        const dateStr = formatDate(new Date(year, month, day));
        const dayData = monthData[dateStr];
        const colorClass = getColorClass(dayData);

        let classes = colorClass;

        // Highlight today
        if (dateStr === todayStr) {
            classes += ' today';
        }

        const dayEl = createDayElement(day, classes);
        calendarGrid.appendChild(dayEl);
    }

    // Calculate remaining cells to fill grid
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days

    // Render next month's leading days
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, 'other-month empty-day');
        calendarGrid.appendChild(dayEl);
    }
}

function createDayElement(day, className = '') {
    const dayEl = document.createElement('div');
    dayEl.className = `calendar-day ${className}`;
    dayEl.textContent = day;
    return dayEl;
}

function getColorClass(dayData) {
    if (!dayData) {
        return 'no-data';
    }

    const { diet_completed, exercise_completed } = dayData;

    if (diet_completed && exercise_completed) {
        return 'success'; // Both completed - Green
    } else if (!diet_completed && exercise_completed) {
        return 'partial'; // Only exercise - Yellow/Orange
    } else if (!diet_completed && !exercise_completed) {
        return 'fail'; // Neither completed - Red
    } else if (diet_completed && !exercise_completed) {
        return 'fail'; // Only diet (treat as fail since user wants only exercise to be yellow)
    }

    return 'no-data';
}

/* ========================================
   Navigation
   ======================================== */
function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

/* ========================================
   Toast Notifications
   ======================================== */
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/* ========================================
   Start Application
   ======================================== */
document.addEventListener('DOMContentLoaded', init);
