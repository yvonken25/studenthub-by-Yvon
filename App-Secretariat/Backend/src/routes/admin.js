const express = require('express');
const { authentifier } = require('../middleware/auth');
const { exigerRole } = require('../middleware/roles');

const router = express.Router();

router.get('/profils', authentifier, exigerRole('admin'), async (req, res) => {
  const { data, error } = await req.db
    .from('profils')
    .select('id, nom_complet, role, cree_le')
    .order('cree_le');

  if (error) return res.status(500).json({ erreur: error.message });
  res.json(data);
});

module.exports = router;