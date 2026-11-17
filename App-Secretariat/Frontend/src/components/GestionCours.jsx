import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { appelApi } from '../services/api';

function Inscriptions({ cours, etudiants }) {
  const { token } = useAuth();
  const chemin = `/admin/cours/${cours.id}/inscriptions`;
  const { donnees: inscrits, erreur, recharger } = useApi(chemin);
  const [choix, setChoix] = useState('');
  const [retour, setRetour] = useState('');

  async function agir(methode, url, corps) {
    setRetour('');
    try {
      await appelApi(url, { methode, corps, token });
      recharger();
    } catch (e) {
      setRetour(e.message);
    }
  }

  async function inscrire() {
    if (!choix) return;
    await agir('POST', chemin, { etudiant_id: choix });
    setChoix('');
  }

  async function desinscrire(e) {
    const ok = window.confirm(
      `Désinscrire ${e.nom_complet} ? Sa note dans ce cours sera aussi supprimée.`
    );
    if (ok) await agir('DELETE', `${chemin}/${e.etudiant_id}`);
  }

  const dejaInscrits = new Set((inscrits ?? []).map((i) => i.etudiant_id));
  const disponibles = etudiants.filter((e) => !dejaInscrits.has(e.id));

  return (
    <div className="panneau">
      {erreur && <p className="erreur">{erreur}</p>}
      {!inscrits && !erreur && <p>Chargement...</p>}
      {inscrits && inscrits.length === 0 && <p>Aucun étudiant inscrit.</p>}
      {inscrits && inscrits.length > 0 && (
        <ul className="puces">
          {inscrits.map((e) => (
            <li key={e.etudiant_id}>
              {e.nom_complet}
              <button className="danger" onClick={() => desinscrire(e)} title="Désinscrire">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <select value={choix} onChange={(e) => setChoix(e.target.value)}>
          <option value="">Choisir un étudiant à inscrire...</option>
          {disponibles.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom_complet}
            </option>
          ))}
        </select>
        <button onClick={inscrire} disabled={!choix}>
          Inscrire
        </button>
      </div>
      {retour && <small className="erreur">{retour}</small>}
    </div>
  );
}

export default function GestionCours() {
  const { token } = useAuth();
  const { donnees: cours, erreur, recharger } = useApi('/admin/cours');
  const { donnees: profils } = useApi('/admin/profils');
  const [code, setCode] = useState('');
  const [titre, setTitre] = useState('');
  const [professeurId, setProfesseurId] = useState('');
  const [ouvert, setOuvert] = useState(null);
  const [retour, setRetour] = useState(null);

  const professeurs = (profils ?? []).filter((p) => p.role === 'professeur');
  const etudiants = (profils ?? []).filter((p) => p.role === 'etudiant');

  async function creer(e) {
    e.preventDefault();
    setRetour(null);
    try {
      await appelApi('/admin/cours', {
        methode: 'POST',
        corps: { code, titre, professeur_id: professeurId || null },
        token,
      });
      setCode('');
      setTitre('');
      setProfesseurId('');
      setRetour({ ok: true, texte: 'Cours créé' });
      recharger();
    } catch (err) {
      setRetour({ ok: false, texte: err.message });
    }
  }

  async function changerProfesseur(c, valeur) {
    setRetour(null);
    try {
      await appelApi(`/admin/cours/${c.id}`, {
        methode: 'PATCH',
        corps: { professeur_id: valeur || null },
        token,
      });
      recharger();
    } catch (err) {
      setRetour({ ok: false, texte: err.message });
    }
  }

  async function supprimer(c) {
    const ok = window.confirm(
      `Supprimer le cours ${c.code} ? Ses inscriptions et toutes ses notes seront supprimées.`
    );
    if (!ok) return;
    setRetour(null);
    try {
      await appelApi(`/admin/cours/${c.id}`, { methode: 'DELETE', token });
      if (ouvert === c.id) setOuvert(null);
      recharger();
    } catch (err) {
      setRetour({ ok: false, texte: err.message });
    }
  }

  return (
    <>
      <form className="ligne-formulaire" onSubmit={creer}>
        <label>
          Code
          <input value={code} onChange={(e) => setCode(e.target.value)}
                 minLength={2} maxLength={20} required placeholder="INFO102" />
        </label>
        <label>
          Titre
          <input value={titre} onChange={(e) => setTitre(e.target.value)}
                 minLength={3} maxLength={120} required placeholder="Réseaux" />
        </label>
        <label>
          Professeur
          <select value={professeurId} onChange={(e) => setProfesseurId(e.target.value)}>
            <option value="">Aucun pour le moment</option>
            {professeurs.map((p) => (
              <option key={p.id} value={p.id}>{p.nom_complet}</option>
            ))}
          </select>
        </label>
        <button type="submit">Créer le cours</button>
      </form>
      {retour && <p className={retour.ok ? 'ok' : 'erreur'}>{retour.texte}</p>}

      {erreur && <p className="erreur">{erreur}</p>}
      {!cours && !erreur && <p>Chargement...</p>}
      {cours && cours.length === 0 && <p>Aucun cours.</p>}
      {cours && cours.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Titre</th>
              <th>Professeur</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cours.map((c) => (
              <>
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.titre}</td>
                  <td>
                    <select value={c.professeur_id ?? ''}
                            onChange={(e) => changerProfesseur(c, e.target.value)}>
                      <option value="">Aucun</option>
                      {professeurs.map((p) => (
                        <option key={p.id} value={p.id}>{p.nom_complet}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="secondaire"
                              onClick={() => setOuvert(ouvert === c.id ? null : c.id)}>
                        {ouvert === c.id ? 'Masquer les inscrits' : 'Inscrits'}
                      </button>
                      <button className="danger" onClick={() => supprimer(c)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
                {ouvert === c.id && (
                  <tr key={`${c.id}-inscrits`}>
                    <td colSpan={4}>
                      <Inscriptions cours={c} etudiants={etudiants} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}