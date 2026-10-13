// ==========================================
// CONFIGURATION SUPABASE
// Supabase > Project Settings > API : copie "Project URL" et la clé "anon public".
// La clé "anon" est faite pour être publique : la sécurité est assurée
// par les règles (RLS) définies dans supabase/schema.sql.
// ⚠️ Ne mets JAMAIS la clé "service_role" ici.
// ==========================================
window.SUPABASE_CONFIG = {
    url: '',      // ex : 'https://abcdefgh.supabase.co'
    anonKey: ''   // ex : 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'
};

// Client partagé par le site et l'espace admin (null si non configuré)
window.db = (window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey && window.supabase)
    ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)
    : null;
