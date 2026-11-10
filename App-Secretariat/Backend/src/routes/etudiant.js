const express = require('express');
const { authentifier } = require('../middleware/auth');
const { exigerRole } = require('../middleware/roles');

const router = express.Router();

router.get('/mes-notes', authentifier, exigerRole('etudiant'), async (req, res) => {
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

module.exports = router;