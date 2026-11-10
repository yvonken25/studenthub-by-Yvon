const express = require('express');
const { clientAnonyme, clientPourUtilisateur } = require('../config/supabase');
const { authentifier } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body || {};
  if (!email || !mot_de_passe) {
    return res.status(400).json({ erreur: 'email et mot_de_passe requis' });
  }

  const { data, error } = await clientAnonyme().auth.signInWithPassword({
    email,
    password: mot_de_passe,
  });
  if (error) {
    console.log('Erreur login Supabase :', error.message);
    return res.status(401).json({ erreur: 'Identifiants incorrects' });
  }

  const token = data.session.access_token;
  const { data: profil } = await clientPourUtilisateur(token)
    .from('profils')
    .select('id, nom_complet, role')
    .eq('id', data.user.id)
    .single();

  res.json({ token, utilisateur: { ...profil, email: data.user.email } });
});

router.get('/moi', authentifier, (req, res) => {
  res.json(req.utilisateur);
});

module.exports = router;