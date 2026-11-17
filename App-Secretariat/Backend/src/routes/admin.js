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

// ===================== Gestion des cours et des roles =====================
const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ['etudiant', 'professeur', 'admin'];

function estUuid(valeur) {
  return typeof valeur === 'string' && REGEX_UUID.test(valeur);
}

function idEntier(valeur) {
  const n = Number(valeur);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Verifie qu'un profil existe avec le role attendu
async function profilAvecRole(db, id, role) {
  const { data } = await db
    .from('profils')
    .select('id')
    .eq('id', id)
    .eq('role', role)
    .maybeSingle();
  return Boolean(data);
}

// Liste des cours avec le nom du professeur
router.get('/cours', async (req, res) => {
  const { data, error } = await req.db
    .from('cours')
    .select('id, code, titre, professeur_id, profils(nom_complet)')
    .order('code');
  if (error) return res.status(500).json({ erreur: error.message });

  res.json(
    data.map(({ profils, ...c }) => ({ ...c, professeur: profils?.nom_complet ?? null }))
  );
});

// Creer un cours
router.post('/cours', async (req, res) => {
  const corps = req.body || {};
  const code = typeof corps.code === 'string' ? corps.code.trim().toUpperCase() : '';
  const titre = typeof corps.titre === 'string' ? corps.titre.trim() : '';

  if (code.length < 2 || code.length > 20) {
    return res.status(400).json({ erreur: 'Le code doit faire entre 2 et 20 caracteres' });
  }
  if (titre.length < 3 || titre.length > 120) {
    return res.status(400).json({ erreur: 'Le titre doit faire entre 3 et 120 caracteres' });
  }

  let professeurId = null;
  if (corps.professeur_id) {
    if (!estUuid(corps.professeur_id) ||
        !(await profilAvecRole(req.db, corps.professeur_id, 'professeur'))) {
      return res.status(400).json({ erreur: 'Professeur invalide' });
    }
    professeurId = corps.professeur_id;
  }

  const { data, error } = await req.db
    .from('cours')
    .insert({ code, titre, professeur_id: professeurId })
    .select('id, code, titre, professeur_id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erreur: 'Ce code de cours existe deja' });
    }
    return res.status(500).json({ erreur: error.message });
  }
  res.status(201).json(data);
});

// Modifier le titre et/ou le professeur d'un cours
router.patch('/cours/:id', async (req, res) => {
  const id = idEntier(req.params.id);
  if (!id) return res.status(400).json({ erreur: 'Identifiant de cours invalide' });

  const corps = req.body || {};
  const maj = {};

  if ('titre' in corps) {
    const titre = typeof corps.titre === 'string' ? corps.titre.trim() : '';
    if (titre.length < 3 || titre.length > 120) {
      return res.status(400).json({ erreur: 'Le titre doit faire entre 3 et 120 caracteres' });
    }
    maj.titre = titre;
  }

  if ('professeur_id' in corps) {
    if (corps.professeur_id === null || corps.professeur_id === '') {
      maj.professeur_id = null;
    } else if (estUuid(corps.professeur_id) &&
               (await profilAvecRole(req.db, corps.professeur_id, 'professeur'))) {
      maj.professeur_id = corps.professeur_id;
    } else {
      return res.status(400).json({ erreur: 'Professeur invalide' });
    }
  }

  if (Object.keys(maj).length === 0) {
    return res.status(400).json({ erreur: 'Rien a modifier' });
  }

  const { data, error } = await req.db
    .from('cours')
    .update(maj)
    .eq('id', id)
    .select('id, code, titre, professeur_id')
    .maybeSingle();

  if (error) return res.status(500).json({ erreur: error.message });
  if (!data) return res.status(404).json({ erreur: 'Cours introuvable' });
  res.json(data);
});

// Supprimer un cours (supprime aussi ses inscriptions et ses notes)
router.delete('/cours/:id', async (req, res) => {
  const id = idEntier(req.params.id);
  if (!id) return res.status(400).json({ erreur: 'Identifiant de cours invalide' });

  const { data, error } = await req.db.from('cours').delete().eq('id', id).select('id');
  if (error) return res.status(500).json({ erreur: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ erreur: 'Cours introuvable' });
  }
  res.status(204).end();
});

// Etudiants inscrits a un cours
router.get('/cours/:id/inscriptions', async (req, res) => {
  const id = idEntier(req.params.id);
  if (!id) return res.status(400).json({ erreur: 'Identifiant de cours invalide' });

  const { data, error } = await req.db
    .from('inscriptions')
    .select('etudiant_id, profils(nom_complet)')
    .eq('cours_id', id);
  if (error) return res.status(500).json({ erreur: error.message });

  res.json(
    data
      .map((i) => ({ etudiant_id: i.etudiant_id, nom_complet: i.profils?.nom_complet ?? '' }))
      .sort((a, b) => a.nom_complet.localeCompare(b.nom_complet, 'fr'))
  );
});

// Inscrire un etudiant
router.post('/cours/:id/inscriptions', async (req, res) => {
  const id = idEntier(req.params.id);
  if (!id) return res.status(400).json({ erreur: 'Identifiant de cours invalide' });

  const etudiantId = req.body?.etudiant_id;
  if (!estUuid(etudiantId) || !(await profilAvecRole(req.db, etudiantId, 'etudiant'))) {
    return res.status(400).json({ erreur: 'Etudiant invalide' });
  }

  const { error } = await req.db
    .from('inscriptions')
    .insert({ etudiant_id: etudiantId, cours_id: id });

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erreur: 'Etudiant deja inscrit a ce cours' });
    }
    if (error.code === '23503') {
      return res.status(404).json({ erreur: 'Cours introuvable' });
    }
    return res.status(500).json({ erreur: error.message });
  }
  res.status(201).json({ etudiant_id: etudiantId, cours_id: id });
});

// Desinscrire un etudiant (supprime aussi sa note dans ce cours)
router.delete('/cours/:id/inscriptions/:etudiantId', async (req, res) => {
  const id = idEntier(req.params.id);
  if (!id || !estUuid(req.params.etudiantId)) {
    return res.status(400).json({ erreur: 'Identifiant invalide' });
  }

  const { data, error } = await req.db
    .from('inscriptions')
    .delete()
    .eq('cours_id', id)
    .eq('etudiant_id', req.params.etudiantId)
    .select('cours_id');

  if (error) return res.status(500).json({ erreur: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ erreur: 'Inscription introuvable' });
  }
  res.status(204).end();
});

// Changer le role d'un utilisateur
router.patch('/profils/:id/role', async (req, res) => {
  const { id } = req.params;
  if (!estUuid(id)) return res.status(400).json({ erreur: 'Identifiant invalide' });

  const role = req.body?.role;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ erreur: 'Role invalide' });
  }
  if (id === req.utilisateur.id) {
    return res.status(400).json({ erreur: 'Vous ne pouvez pas modifier votre propre role' });
  }

  const { data, error } = await req.db
    .from('profils')
    .update({ role })
    .eq('id', id)
    .select('id, nom_complet, role')
    .maybeSingle();

  if (error) return res.status(500).json({ erreur: error.message });
  if (!data) return res.status(404).json({ erreur: 'Utilisateur introuvable' });
  res.json(data);
});


// ============================ Tableau de bord ============================
router.get('/statistiques', async (req, res) => {
  const db = req.db;

  async function compter(table, filtre) {
    let requete = db.from(table).select('*', { count: 'exact', head: true });
    if (filtre) requete = filtre(requete);
    const { count, error } = await requete;
    if (error) throw error;
    return count ?? 0;
  }

  async function lire(requete) {
    const { data, error } = await requete;
    if (error) throw error;
    return data;
  }

  try {
    const [
      etudiants, professeurs, admins,
      coursTotal, coursSansProf,
      inscriptionsTotal, notesTotal,
      enAttente, acceptees, refusees,
      inscriptions, notes, cours, recentes,
    ] = await Promise.all([
      compter('profils', (q) => q.eq('role', 'etudiant')),
      compter('profils', (q) => q.eq('role', 'professeur')),
      compter('profils', (q) => q.eq('role', 'admin')),
      compter('cours'),
      compter('cours', (q) => q.is('professeur_id', null)),
      compter('inscriptions'),
      compter('notes'),
      compter('demandes', (q) => q.eq('statut', 'en_attente')),
      compter('demandes', (q) => q.eq('statut', 'acceptee')),
      compter('demandes', (q) => q.eq('statut', 'refusee')),
      lire(db.from('inscriptions').select('cours_id').limit(10000)),
      lire(db.from('notes').select('valeur').limit(10000)),
      lire(db.from('cours').select('id, code, titre')),
      lire(
        db.from('demandes')
          .select('id, objet, statut, cree_le, profils(nom_complet)')
          .order('cree_le', { ascending: false })
          .limit(5)
      ),
    ]);

    // Effectif par cours
    const effectifs = new Map();
    for (const i of inscriptions) {
      effectifs.set(i.cours_id, (effectifs.get(i.cours_id) ?? 0) + 1);
    }
    const coursPopulaires = cours
      .map((c) => ({ id: c.id, code: c.code, titre: c.titre, etudiants: effectifs.get(c.id) ?? 0 }))
      .sort((a, b) => b.etudiants - a.etudiants)
      .slice(0, 5);

    // Moyenne generale des notes
    const moyenne =
      notes.length > 0
        ? Math.round((notes.reduce((s, n) => s + Number(n.valeur), 0) / notes.length) * 10) / 10
        : null;

    res.json({
      utilisateurs: { etudiants, professeurs, admins, total: etudiants + professeurs + admins },
      cours: { total: coursTotal, sans_professeur: coursSansProf },
      inscriptions: inscriptionsTotal,
      notes: { total: notesTotal, moyenne },
      demandes: { en_attente: enAttente, acceptee: acceptees, refusee: refusees },
      cours_populaires: coursPopulaires,
      demandes_recentes: recentes.map(({ profils, ...d }) => ({
        ...d,
        etudiant: profils?.nom_complet ?? '',
      })),
    });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

module.exports = router;