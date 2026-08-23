// ==========================================
// app.js — ПОЛНАЯ ВЕРСИЯ
// ==========================================

let currentUser = null;

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Загрузка приложения...');
    
    // ПРОВЕРЯЕМ СЕССИЮ
    try {
        var stored = sessionStorage.getItem('currentUser');
        if (stored) {
            currentUser = JSON.parse(stored);
            console.log('👤 Пользователь найден:', currentUser.name);
            showDashboard();
            loadUserData();
        } else {
            console.log('🔒 Пользователь не авторизован');
            showLogin();
        }
    } catch (e) {
        console.log('🔒 Ошибка проверки сессии');
        showLogin();
    }
});

// ==========================================
// ПОКАЗ СТРАНИЦ
// ==========================================
function showLogin() {
    var loginPage = document.getElementById('loginPage');
    var appContent = document.getElementById('appContent');
    var dashboard = document.getElementById('dashboard');
    
    if (loginPage) loginPage.style.display = 'block';
    if (appContent) appContent.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
}

function showDashboard() {
    var loginPage = document.getElementById('loginPage');
    var appContent = document.getElementById('appContent');
    var dashboard = document.getElementById('dashboard');
    var adminPanel = document.getElementById('adminPanel');
    var welcome = document.getElementById('welcomeMessage');
    
    if (loginPage) loginPage.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
    if (dashboard) dashboard.style.display = 'block';
    if (welcome) welcome.textContent = '👋 Привет, ' + (currentUser ? currentUser.name : 'Пользователь') + '!';
    
    if (currentUser && currentUser.role === 'admin') {
        if (adminPanel) adminPanel.style.display = 'block';
    }
}

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
// ==========================================
window.switchDashboardPage = function(page) {
    console.log('📄 Переключаем на:', page);
    
    var pages = document.querySelectorAll('.dashboard-page');
    pages.forEach(function(p) {
        p.style.display = 'none';
    });
    
    var target = document.getElementById('page-' + page);
    if (target) {
        target.style.display = 'block';
    } else {
        console.warn('⚠️ Страница не найдена:', page);
    }
    
    var buttons = document.querySelectorAll('.dashboard-sidebar button');
    buttons.forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });
};

// ==========================================
// ЗАГРУЗКА ДАННЫХ
// ==========================================
function loadUserData() {
    if (!currentUser) return;
    console.log('📊 Загружаем данные для:', currentUser.name);
    
    // Показываем страницу "Обзор" по умолчанию
    window.switchDashboardPage('overview');
}

// ==========================================
// ВЫХОД
// ==========================================
window.logout = function() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        sessionStorage.clear();
        localStorage.clear();
        location.reload();
    }
};

console.log('✅ app.js загружен!');
