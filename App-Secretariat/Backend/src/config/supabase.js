require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL et SUPABASE_ANON_KEY doivent etre definis dans .env');
}

// Client partage : sert a verifier les tokens
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Client neuf pour chaque connexion (login)
function clientAnonyme() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Client lie a un utilisateur : les regles RLS s'appliquent avec SON identite
function clientPourUtilisateur(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

module.exports = { supabase, clientAnonyme, clientPourUtilisateur };