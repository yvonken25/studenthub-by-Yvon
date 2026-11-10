const { supabase, clientPourUtilisateur } = require('../config/supabase');

async function authentifier(req, res, next) {
  const entete = req.headers.authorization || '';
  const [type, token] = entete.split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ erreur: 'Token manquant' });
  }

  // Supabase verifie la signature et l'expiration du token
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ erreur: 'Token invalide ou expire' });
  }

  // Client lie a l'utilisateur : les regles RLS s'appliquent avec son identite
  const db = clientPourUtilisateur(token);
  const { data: profil, error: errProfil } = await db
    .from('profils')
    .select('id, nom_complet, role')
    .eq('id', data.user.id)
    .single();

  if (errProfil || !profil) {
    return res.status(403).json({ erreur: 'Profil introuvable' });
  }

  req.utilisateur = {
    id: profil.id,
    email: data.user.email,
    nom_complet: profil.nom_complet,
    role: profil.role,
  };
  req.db = db; // a utiliser dans les routes pour interroger la base
  next();
}

module.exports = { authentifier };