// ==========================================
// auth.js — БЕЗОПАСНАЯ АВТОРИЗАЦИЯ
// ==========================================

// ПРОВЕРЯЕМ, НЕ ОБЪЯВЛЕН ЛИ УЖЕ supabase
if (typeof window.supabase === 'undefined') {
    const SUPABASE_URL = 'https://liqqdixrtvnrrvgkfvbn.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXFkaXhydHZucnJ2Z2tmdmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTMzMzksImV4cCI6MjA5OTQyOTMzOX0.Jqrnt5DOKNURe5HERWIhMvc6KChurAg5iHkfMBw4P2A';

    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase создан');
}

// ДЕЛАЕМ ФУНКЦИИ ГЛОБАЛЬНЫМИ
window.secureLogin = async function(email, password) {
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;

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

window.secureRegister = async function(email, password, name) {
    try {
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    role: 'student'
                }
            }
        });

        if (error) throw error;

        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, user: data.user };

    } catch (error) {
        return { success: false, error: error.message };
    }
};

window.checkSession = async function() {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) return null;
    
    const { data: profile } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
    
    if (!profile) return null;
    
    return {
        id: session.user.id,
        email: session.user.email,
        ...profile
    };
};

window.secureLogout = async function() {
    await window.supabase.auth.signOut();
    sessionStorage.removeItem('currentUser');
    window.location.reload();
};

window.getCurrentUser = function() {
    try {
        return JSON.parse(sessionStorage.getItem('currentUser'));
    } catch {
        return null;
    }
};

console.log('✅ auth.js загружен!');
