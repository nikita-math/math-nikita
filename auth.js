// ==========================================
// auth.js — БЕЗОПАСНАЯ АВТОРИЗАЦИЯ (НОВЫЙ ПОДХОД)
// ==========================================

const SUPABASE_URL = 'https://liqqdixrtvnrrvgkfvbn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXFkaXhydHZucnJ2Z2tmdmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTMzMzksImV4cCI6MjA5OTQyOTMzOX0.Jqrnt5DOKNURe5HERWIhMvc6KChurAg5iHkfMBw4P2A';

// СОЗДАЁМ КЛИЕНТ
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// ВХОД (ЧЕРЕЗ ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ БАЗЫ)
// ==========================================
window.secureLogin = async function(email, password) {
    try {
        // ВХОД ЧЕРЕЗ API СУПАБЕЙС
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.error || !data.access_token) {
            // ПРОБУЕМ СТАРУЮ ТАБЛИЦУ (для обратной совместимости)
            const { data: userData, error: userError } = await window.supabase
                .from('students')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();
            
            if (userError || !userData) {
                return { success: false, error: 'Неверный логин или пароль' };
            }
            
            // СОХРАНЯЕМ ПОЛЬЗОВАТЕЛЯ
            const user = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role || 'student'
            };
            
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user: user };
        }
        
        // ПОЛУЧАЕМ ПРОФИЛЬ
        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError) {
            // СОЗДАЁМ ПРОФИЛЬ НА ЛЕТУ
            const newProfile = {
                id: data.user.id,
                name: data.user.user_metadata?.name || data.user.email,
                role: data.user.user_metadata?.role || 'student'
            };
            
            await window.supabase.from('profiles').insert([newProfile]);
            
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: newProfile.name,
                role: newProfile.role
            };
            
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user: user };
        }
        
        const user = {
            id: data.user.id,
            email: data.user.email,
            ...profile
        };
        
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user: user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==========================================
// РЕГИСТРАЦИЯ
// ==========================================
window.secureRegister = async function(email, password, name) {
    try {
        // СОЗДАЁМ ПОЛЬЗОВАТЕЛЯ В СТАРОЙ ТАБЛИЦЕ (КОСТЫЛЬ)
        const { data, error } = await window.supabase
            .from('students')
            .insert([{ email, password, name, role: 'student' }])
            .select();
        
        if (error) throw error;
        
        const user = {
            id: data[0].id,
            email: data[0].email,
            name: data[0].name,
            role: data[0].role || 'student'
        };
        
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user: user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==========================================
// ПРОВЕРКА СЕССИИ
// ==========================================
window.checkSession = function() {
    try {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

// ==========================================
// ВЫХОД
// ==========================================
window.secureLogout = function() {
    sessionStorage.removeItem('currentUser');
    window.location.reload();
};

console.log('✅ auth.js загружен! (новая версия)');
