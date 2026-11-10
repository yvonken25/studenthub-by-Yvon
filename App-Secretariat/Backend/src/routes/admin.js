const express = require('express');
const { authentifier } = require('../middleware/auth');
const { exigerRole } = require('../middleware/roles');

const router = express.Router();

router.use(authentifier, exigerRole('admin'));

const STATUTS = ['en_attente', 'acceptee', 'refusee'];

router.get('/profils', async (req, res) => {
  const { data, error } = await req.db
    .from('profils')
    .select('id, nom_complet, role, cree_le')
    .order('cree_le');

  if (error) return res.status(500).json({ erreur: error.message });
  res.json(data);
});

// Liste des demandes, filtrable : /admin/demandes?statut=en_attente
router.get('/demandes', async (req, res) => {
  const { statut } = req.query;
  if (statut !== undefined && !STATUTS.includes(statut)) {
    return res.status(400).json({ erreur: 'Statut invalide' });
  }

  let requete = req.db
    .from('demandes')
    .select('id, objet, message, statut, reponse, cree_le, profils(nom_complet)')
    .order('cree_le', { ascending: false });
  if (statut) requete = requete.eq('statut', statut);

  const { data, error } = await requete;
  if (error) return res.status(500).json({ erreur: error.message });

  res.json(
    data.map(({ profils, ...d }) => ({ ...d, etudiant: profils?.nom_complet ?? '' }))
  );
});

// Traiter une demande : accepter ou refuser
router.patch('/demandes/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erreur: 'Identifiant de demande invalide' });
  }

  const corps = req.body || {};
  if (!['acceptee', 'refusee'].includes(corps.statut)) {
    return res.status(400).json({ erreur: 'Statut invalide (acceptee ou refusee)' });
  }

  const reponse =
    typeof corps.reponse === 'string' ? corps.reponse.trim().slice(0, 500) : '';
  if (corps.statut === 'refusee' && !reponse) {
    return res.status(400).json({ erreur: 'Un motif est obligatoire pour un refus' });
  }

  // Seule une demande encore "en_attente" peut etre traitee
  const { data, error } = await req.db
    .from('demandes')
    .update({ statut: corps.statut, reponse: reponse || null })
    .eq('id', id)
    .eq('statut', 'en_attente')
    .select('id, statut, reponse')
    .maybeSingle();

  if (error) return res.status(500).json({ erreur: error.message });
  if (!data) {
    return res.status(404).json({ erreur: 'Demande introuvable ou deja traitee' });
  }
  res.json(data);
});

module.exports = router;