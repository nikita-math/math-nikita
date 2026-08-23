// ==========================================
// app.js — ПОЛНАЯ ВЕРСИЯ (ВСЁ РАБОТАЕТ!)
// ==========================================

let currentUser = null;

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Загрузка приложения...');
    
    // Проверяем сессию
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
    
    window.loadSectionsAndVideos();
    window.switchDashboardPage('overview');
}

// ==========================================
// ВИДЕОРАЗДЕЛЫ (из старого кода)
// ==========================================
var sections = [];

window.loadSectionsAndVideos = function() {
    var tabsContainer1 = document.getElementById('videoTabsPart1');
    var tabsContainer2 = document.getElementById('videoTabsPart2');
    
    if (!tabsContainer1 || !tabsContainer2) return;
    
    tabsContainer1.innerHTML = '⏳ Загрузка...';
    tabsContainer2.innerHTML = '⏳ Загрузка...';
    
    window.supabase
        .from('video_sections')
        .select('id, name, order_num')
        .order('order_num', { ascending: true })
        .then(function(response) {
            if (response.error) {
                tabsContainer1.innerHTML = '❌ Ошибка: ' + response.error.message;
                return;
            }
            sections = response.data || [];
            if (sections.length === 0) {
                tabsContainer1.innerHTML = '📭 Нет разделов. Добавьте их в базе.';
                tabsContainer2.innerHTML = '📭 Нет разделов. Добавьте их в базе.';
                return;
            }
            renderVideoTabs();
        });
};

window.renderVideoTabs = function() {
    var tabsContainer1 = document.getElementById('videoTabsPart1');
    var tabsContainer2 = document.getElementById('videoTabsPart2');
    if (!sections || sections.length === 0) {
        tabsContainer1.innerHTML = '📭 Нет разделов';
        tabsContainer2.innerHTML = '📭 Нет разделов';
        return;
    }
    var part1 = sections.slice(0, 12);
    var part2 = sections.slice(12);
    
    tabsContainer1.innerHTML = '';
    tabsContainer2.innerHTML = '';
    
    part1.forEach(function(section, index) {
        var num = index + 1;
        var btn = document.createElement('button');
        btn.innerHTML = '<span class="num">' + num + '</span> ' + section.name;
        btn.onclick = function() { window.openSection(section.id); };
        tabsContainer1.appendChild(btn);
    });
    
    part2.forEach(function(section, index) {
        var num = index + 13;
        var btn = document.createElement('button');
        btn.innerHTML = '<span class="num">' + num + '</span> ' + section.name;
        btn.onclick = function() { window.openSection(section.id); };
        tabsContainer2.appendChild(btn);
    });
};

// ==========================================
// ОТКРЫТИЕ РАЗДЕЛА
// ==========================================
window.openSection = function(sectionId) {
    var mainContent = document.getElementById('mainContent');
    var dashboard = document.getElementById('dashboard');
    var adminPanel = document.getElementById('adminPanel');
    var sectionPage = document.getElementById('sectionPage');
    
    if (mainContent) mainContent.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
    if (sectionPage) sectionPage.classList.add('active');
    
    window.loadSectionContent(sectionId);
};

window.loadSectionContent = function(sectionId) {
    var content = document.getElementById('sectionContent');
    if (!content) return;
    
    content.innerHTML = '<div class="loading">⏳ Загрузка...</div>';
    
    window.supabase
        .from('video_sections')
        .select('*')
        .eq('id', sectionId)
        .single()
        .then(function(sectionResult) {
            if (sectionResult.error) {
                content.innerHTML = '<div class="empty">❌ Раздел не найден</div>';
                return;
            }
            var section = sectionResult.data;
            
            window.supabase
                .from('videos')
                .select('*')
                .eq('section_id', sectionId)
                .order('created_at', { ascending: false })
                .then(function(videosResult) {
                    var videos = videosResult.data || [];
                    var html = '<h1 class="section-title">' + section.name + '</h1>';
                    if (videos.length === 0) {
                        html += '<div class="empty">📭 Нет видео в этом разделе</div>';
                    } else {
                        videos.forEach(function(v) {
                            var isFile = v.is_file || false;
                            var isVk = v.is_vk || false;
                            var videoUrl = v.youtube_url || '#';
                            var title = v.title || 'Видео';
                            var homework = v.homework || '';
                            
                            html += '<div class="video-item">';
                            if (isFile && videoUrl && videoUrl !== '#') {
                                html += '<div class="video-player-wrapper"><video controls><source src="' + videoUrl + '" type="video/mp4">Ваш браузер не поддерживает видео.</video></div>';
                            } else if (videoUrl && videoUrl !== '#' && videoUrl.includes('youtube.com')) {
                                var embedUrl = videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
                                html += '<div class="video-player-wrapper"><iframe src="' + embedUrl + '" allowfullscreen></iframe></div>';
                            } else if (isVk && videoUrl && videoUrl !== '#') {
                                var vkEmbed = videoUrl;
                                if (videoUrl.includes('vk.com/video')) {
                                    var parts = videoUrl.split('/');
                                    var videoIdParts = parts[parts.length - 1];
                                    if (videoIdParts && videoIdParts.includes('_')) {
                                        var ids = videoIdParts.split('_');
                                        vkEmbed = 'https://vk.com/video_ext.php?oid=' + ids[0] + '&id=' + ids[1] + '&hash=' + Date.now();
                                    }
                                }
                                html += '<div class="video-player-wrapper"><iframe src="' + vkEmbed + '" allowfullscreen></iframe></div>';
                            } else if (videoUrl && videoUrl !== '#') {
                                html += '<div class="video-player-wrapper" style="display:flex; align-items:center; justify-content:center; background:#111; min-height:200px;"><a href="' + videoUrl + '" target="_blank" style="color:#f5a623; font-size:20px; text-decoration:none; border:2px solid #f5a623; padding:16px 32px; border-radius:12px;">▶️ Смотреть видео</a></div>';
                            }
                            html += '<span class="video-title">🎬 ' + title + '</span>';
                            if (videoUrl && videoUrl !== '#') {
                                html += '<div class="video-fallback-link"><span class="label">⚠️ Если видео не работает, вот ссылка:</span><br><a href="' + videoUrl + '" target="_blank">' + videoUrl + '</a></div>';
                            }
                            if (homework) {
                                html += '<div class="video-homework"><strong>📝 ДЗ к уроку:</strong> ' + homework + '</div>';
                            }
                            html += '</div>';
                        });
                    }
                    content.innerHTML = html;
                });
        });
};

// ==========================================
// ДОМАШНИЕ ЗАДАНИЯ (ОБНОВЛЁННЫЕ)
// ==========================================
window.loadHomework = function() {
    if (!currentUser) return;
    var container = document.getElementById('homeworkList');
    if (!container) return;
    
    container.innerHTML = '⏳ Загрузка...';
    
    window.supabase
        .from('homeworks')
        .select('*, video_sections(name, order_num)')
        .eq('student_id', currentUser.id)
        .order('deadline', { ascending: true, nulls_last: true })
        .limit(30)
        .then(function(response) {
            if (response.error) {
                container.innerHTML = '❌ Ошибка загрузки ДЗ.';
                return;
            }
            var data = response.data || [];
            if (data.length === 0) {
                container.innerHTML = '<p style="color:#666; text-align:center; padding:30px;">📭 Нет заданий</p>';
                return;
            }
            var html = '';
            data.forEach(function(hw) {
                var status = hw.status === 'done' ? '✅ Выполнено' : '⏳ В процессе';
                var statusClass = hw.status === 'done' ? 'done' : 'pending';
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
        });
};

window.markHomeworkDone = function(id) {
    if (!currentUser) return;
    
    window.supabase
        .from('homeworks')
        .update({ status: 'done' })
        .eq('id', id)
        .eq('student_id', currentUser.id)
        .then(function(response) {
            if (response.error) {
                alert('❌ Ошибка: ' + response.error.message);
                return;
            }
            window.loadHomework();
        });
};

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
