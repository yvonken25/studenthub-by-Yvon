const express = require('express');
const { authentifier } = require('../middleware/auth');
const { exigerRole } = require('../middleware/roles');

const router = express.Router();

// Toutes les routes de ce fichier sont reservees aux professeurs
router.use(authentifier, exigerRole('professeur'));

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Verifie que le cours existe ET appartient au professeur connecte
async function chargerCours(req, res, next) {
  const coursId = Number(req.params.coursId);
  if (!Number.isInteger(coursId) || coursId <= 0) {
    return res.status(400).json({ erreur: 'Identifiant de cours invalide' });
  }

  const { data, error } = await req.db
    .from('cours')
    .select('id, code, titre')
    .eq('id', coursId)
    .eq('professeur_id', req.utilisateur.id)
    .maybeSingle();

  if (error) return res.status(500).json({ erreur: error.message });
  if (!data) return res.status(404).json({ erreur: 'Cours introuvable' });

  req.cours = data;
  next();
}

function verifierEtudiant(req, res, next) {
  if (!REGEX_UUID.test(req.params.etudiantId)) {
    return res.status(400).json({ erreur: 'Identifiant etudiant invalide' });
  }
  next();
}

// Liste de mes cours
router.get('/mes-cours', async (req, res) => {
  const { data, error } = await req.db
    .from('cours')
    .select('id, code, titre')
    .eq('professeur_id', req.utilisateur.id)
    .order('code');

  if (error) return res.status(500).json({ erreur: error.message });
  res.json(data);
});

// Etudiants inscrits a un de mes cours, avec leur note
router.get('/cours/:coursId/etudiants', chargerCours, async (req, res) => {
  const { data: inscrits, error } = await req.db
    .from('inscriptions')
    .select('etudiant_id, profils(nom_complet)')
    .eq('cours_id', req.cours.id);
  if (error) return res.status(500).json({ erreur: error.message });

  const { data: notes, error: errNotes } = await req.db
    .from('notes')
    .select('etudiant_id, valeur, commentaire')
    .eq('cours_id', req.cours.id);
  if (errNotes) return res.status(500).json({ erreur: errNotes.message });

  const noteParEtudiant = new Map(notes.map((n) => [n.etudiant_id, n]));

  const etudiants = inscrits
    .map((i) => ({
      etudiant_id: i.etudiant_id,
      nom_complet: i.profils?.nom_complet ?? '',
      note: noteParEtudiant.get(i.etudiant_id) ?? null,
    }))
    .sort((a, b) => a.nom_complet.localeCompare(b.nom_complet, 'fr'));

  res.json({ cours: req.cours, etudiants });
});

// Creer ou modifier la note d'un etudiant
router.put(
  '/cours/:coursId/etudiants/:etudiantId/note',
  chargerCours,
  verifierEtudiant,
  async (req, res) => {
    const brute = req.body?.valeur;
    const valeur = Number(brute);
    if (brute === null || brute === undefined || brute === '' ||
        !Number.isFinite(valeur) || valeur < 0 || valeur > 20) {
      return res.status(400).json({ erreur: 'La note doit etre comprise entre 0 et 20' });
    }

    const commentaire =
      typeof req.body.commentaire === 'string'
        ? req.body.commentaire.trim().slice(0, 500) || null
        : null;

    const { data, error } = await req.db
      .from('notes')
      .upsert(
        {
          etudiant_id: req.params.etudiantId,
          cours_id: req.cours.id,
          valeur,
          commentaire,
        },
        { onConflict: 'etudiant_id,cours_id' }
      )
      .select('etudiant_id, valeur, commentaire')
      .single();

    if (error) {
      if (error.code === '23503') {
        return res.status(400).json({ erreur: "Cet etudiant n'est pas inscrit a ce cours" });
      }
      return res.status(500).json({ erreur: error.message });
    }
    res.json(data);
  }
);

// Supprimer la note d'un etudiant
router.delete(
  '/cours/:coursId/etudiants/:etudiantId/note',
  chargerCours,
  verifierEtudiant,
  async (req, res) => {
    const { error } = await req.db
      .from('notes')
      .delete()
      .eq('cours_id', req.cours.id)
      .eq('etudiant_id', req.params.etudiantId);

    if (error) return res.status(500).json({ erreur: error.message });
    res.status(204).end();
  }
);

module.exports = router;