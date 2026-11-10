const express = require('express');
const { authentifier } = require('../middleware/auth');
const { exigerRole } = require('../middleware/roles');

const router = express.Router();

router.get('/mes-notes', authentifier, exigerRole('etudiant'), async (req, res) => {
  const { data, error } = await req.db
    .from('notes')
    .select('cours_id, valeur, commentaire, cree_le')
    .order('cree_le', { ascending: false });

  if (error) return res.status(500).json({ erreur: error.message });
  res.json(data);
});

module.exports = router;