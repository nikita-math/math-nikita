// ==========================================
// app.js — ЛОГИКА ПРИЛОЖЕНИЯ (ИСПРАВЛЕННЫЙ)
// ==========================================

let currentUser = null;

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Загрузка приложения...');
    
    currentUser = await window.checkSession();
    
    if (currentUser) {
        console.log('👤 Пользователь найден:', currentUser.name);
        showDashboard();
        loadUserData();
    } else {
        console.log('🔒 Пользователь не авторизован');
        showLogin();
    }
    
    setupEventListeners();
});

// ==========================================
// НАСТРОЙКА СОБЫТИЙ
// ==========================================
function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
    }
}

// ==========================================
// ПОКАЗ СТРАНИЦ
// ==========================================
function showLogin() {
    const loginPage = document.getElementById('loginPage');
    const appContent = document.getElementById('appContent');
    if (loginPage) loginPage.style.display = 'block';
    if (appContent) appContent.style.display = 'none';
}

function showDashboard() {
    const loginPage = document.getElementById('loginPage');
    const appContent = document.getElementById('appContent');
    if (loginPage) loginPage.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
    
    const welcome = document.getElementById('welcomeMessage');
    if (welcome) {
        welcome.textContent = '👋 Привет, ' + (currentUser.name || 'Пользователь') + '!';
    }
    
    if (currentUser && currentUser.role === 'admin') {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.style.display = 'block';
    }
}

// ==========================================
// ОБРАБОТКА ВХОДА
// ==========================================
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const resultDiv = document.getElementById('result');
    
    if (!email || !password) {
        resultDiv.className = 'result-error';
        resultDiv.innerHTML = '❌ Введите email и пароль';
        return;
    }
    
    resultDiv.className = 'result-info';
    resultDiv.innerHTML = '⏳ Проверка...';
    
    const result = await window.secureLogin(email, password);
    
    if (result.success) {
        currentUser = result.user;
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = '✅ Привет, ' + (currentUser.name || 'Пользователь') + '!';
        showDashboard();
        loadUserData();
    } else {
        resultDiv.className = 'result-error';
        resultDiv.innerHTML = '❌ ' + result.error;
    }
}

// ==========================================
// ОБРАБОТКА РЕГИСТРАЦИИ
// ==========================================
async function handleRegister() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const resultDiv = document.getElementById('result');
    
    if (!email || !password) {
        resultDiv.className = 'result-error';
        resultDiv.innerHTML = '❌ Введите email и пароль';
        return;
    }
    
    if (password.length < 6) {
        resultDiv.className = 'result-error';
        resultDiv.innerHTML = '❌ Пароль должен быть не менее 6 символов';
        return;
    }
    
    const name = prompt('Введите ваше имя:');
    if (!name) return;
    
    resultDiv.className = 'result-info';
    resultDiv.innerHTML = '⏳ Создание аккаунта...';
    
    const result = await window.secureRegister(email, password, name);
    
    if (result.success) {
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = '✅ Аккаунт создан! Теперь войдите.';
    } else {
        resultDiv.className = 'result-error';
        resultDiv.innerHTML = '❌ ' + result.error;
    }
}

// ==========================================
// ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ
// ==========================================
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // 👇 ИСПОЛЬЗУЕМ supabaseClient ИЗ auth.js
        const supabase = window.supabaseClient;
        
        const { data: homeworks, error: hwError } = await supabase
            .from('homeworks')
            .select('*, video_sections(name, order_num)')
            .eq('student_id', currentUser.id)
            .order('deadline', { ascending: true, nulls_last: true })
            .limit(50);
        
        if (!hwError && homeworks) {
            renderHomeworks(homeworks);
        }
        
        // Загружаем статистику
        loadStatistics();
        
        // Если админ — загружаем админ-данные
        if (currentUser.role === 'admin') {
            loadAdminData();
        }
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// ==========================================
// ЗАГРУЗКА АДМИН-ДАННЫХ
// ==========================================
async function loadAdminData() {
    if (currentUser.role !== 'admin') return;
    
    try {
        const supabase = window.supabaseClient;
        
        // Все ученики
        const { data: students, error: sError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('name');
        
        if (!sError && students) {
            const container = document.getElementById('studentsList');
            if (container) {
                let html = '<table class="admin-table"><tr><th>Имя</th><th>Email</th><th>Роль</th></tr>';
                students.forEach(s => {
                    html += `<tr><td>${s.name}</td><td>${s.email || '—'}</td><td>${s.role}</td></tr>`;
                });
                html += '</table>';
                container.innerHTML = html;
            }
        }
        
    } catch (error) {
        console.error('Ошибка загрузки админ-данных:', error);
    }
}

// ==========================================
// ОТРИСОВКА ДОМАШНИХ ЗАДАНИЙ
// ==========================================
function renderHomeworks(homeworks) {
    const container = document.getElementById('homeworkList');
    if (!container) return;
    
    if (!homeworks || homeworks.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center; padding:30px;">📭 Нет заданий</p>';
        return;
    }
    
    let html = '';
    homeworks.forEach(hw => {
        const status = hw.status === 'done' ? '✅ Выполнено' : '⏳ В процессе';
        const statusClass = hw.status === 'done' ? 'done' : 'pending';
        
        html += `
            <div class="hw-card">
                <div class="title">${hw.title}</div>
                ${hw.video_sections ? `<div class="meta">📺 Раздел: ${hw.video_sections.name}</div>` : ''}
                ${hw.deadline ? `<div class="meta">📅 Срок: ${hw.deadline}</div>` : ''}
                ${hw.comment ? `<div class="meta comment">📝 ${hw.comment}</div>` : ''}
                <div class="status ${statusClass}">${status}</div>
                ${hw.file_url ? `<div class="meta">📎 <a href="${hw.file_url}" target="_blank">Скачать PDF</a></div>` : ''}
                ${hw.attached_file_url ? `<div class="meta">📎 Ваш файл: <a href="${hw.attached_file_url}" target="_blank">Скачать</a></div>` : ''}
                ${hw.status !== 'done' ? `<button class="admin-btn success" onclick="window.markHomeworkDone('${hw.id}')">✅ Отметить выполненным</button>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// СТАТИСТИКА
// ==========================================
async function loadStatistics() {
    try {
        const supabase = window.supabaseClient;
        
        const { data, error } = await supabase
            .from('homeworks')
            .select('status')
            .eq('student_id', currentUser.id);
        
        if (error) throw error;
        
        const total = data.length;
        const done = data.filter(h => h.status === 'done').length;
        const pending = total - done;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        
        const statTotal = document.getElementById('statTotal');
        const statDone = document.getElementById('statDone');
        const statPending = document.getElementById('statPending');
        const statPercent = document.getElementById('statPercent');
        
        if (statTotal) statTotal.textContent = total;
        if (statDone) statDone.textContent = done;
        if (statPending) statPending.textContent = pending;
        if (statPercent) statPercent.textContent = percent + '%';
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// ==========================================
// ОТМЕТКА ДЗ КАК ВЫПОЛНЕННОГО
// ==========================================
window.markHomeworkDone = async function(id) {
    if (!currentUser) return;
    
    try {
        const supabase = window.supabaseClient;
        
        const { error } = await supabase
            .from('homeworks')
            .update({ status: 'done' })
            .eq('id', id)
            .eq('student_id', currentUser.id);
        
        if (error) throw error;
        
        loadUserData();
        
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
};

// ==========================================
// БЕЗОПАСНЫЙ ВЫХОД
// ==========================================
window.logout = async function() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        await window.secureLogout();
    }
};

console.log('✅ app.js загружен!');
