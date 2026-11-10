const express = require('express');
const { authentifier } = require('../middleware/auth');
const { exigerRole } = require('../middleware/roles');

const router = express.Router();

router.use(authentifier, exigerRole('etudiant'));

// --- Notes ---------------------------------------------------------------
router.get('/mes-notes', async (req, res) => {
  const { data: notes, error } = await req.db
    .from('notes')
    .select('cours_id, valeur, commentaire, cree_le')
    .order('cree_le', { ascending: false });
  if (error) return res.status(500).json({ erreur: error.message });

  let coursParId = new Map();
  const ids = [...new Set(notes.map((n) => n.cours_id))];
  if (ids.length > 0) {
    const { data: cours, error: errCours } = await req.db
      .from('cours')
      .select('id, code, titre')
      .in('id', ids);
    if (errCours) return res.status(500).json({ erreur: errCours.message });
    coursParId = new Map(cours.map((c) => [c.id, c]));
  }

  res.json(notes.map((n) => ({ ...n, cours: coursParId.get(n.cours_id) ?? null })));
});

// --- Demandes au secretariat ---------------------------------------------
router.get('/mes-demandes', async (req, res) => {
  const { data, error } = await req.db
    .from('demandes')
    .select('id, objet, message, statut, reponse, cree_le')
    .order('cree_le', { ascending: false });

  if (error) return res.status(500).json({ erreur: error.message });
  res.json(data);
});

router.post('/mes-demandes', async (req, res) => {
  const corps = req.body || {};
  const objet = typeof corps.objet === 'string' ? corps.objet.trim() : '';
  const message = typeof corps.message === 'string' ? corps.message.trim() : '';

  if (objet.length < 3 || objet.length > 120) {
    return res.status(400).json({ erreur: "L'objet doit faire entre 3 et 120 caracteres" });
  }
  if (message.length > 1000) {
    return res.status(400).json({ erreur: 'Le message ne doit pas depasser 1000 caracteres' });
  }

  // etudiant_id vient du token verifie, jamais du corps de la requete
  const { data, error } = await req.db
    .from('demandes')
    .insert({ etudiant_id: req.utilisateur.id, objet, message: message || null })
    .select('id, objet, message, statut, reponse, cree_le')
    .single();

  if (error) return res.status(500).json({ erreur: error.message });
  res.status(201).json(data);
});

module.exports = router;