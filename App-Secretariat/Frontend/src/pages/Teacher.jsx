import { useState } from 'react';
import Layout from '../components/Layout';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { appelApi } from '../services/api';

function LigneEtudiant({ coursId, etudiant }) {
  const { token } = useAuth();
  const [valeur, setValeur] = useState(etudiant.note?.valeur ?? '');
  const [commentaire, setCommentaire] = useState(etudiant.note?.commentaire ?? '');
  const [retour, setRetour] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const chemin = `/professeur/cours/${coursId}/etudiants/${etudiant.etudiant_id}/note`;

  async function enregistrer() {
    setRetour(null);
    setEnCours(true);
    try {
      await appelApi(chemin, { methode: 'PUT', corps: { valeur, commentaire }, token });
      setRetour({ ok: true, texte: 'Enregistré' });
    } catch (e) {
      setRetour({ ok: false, texte: e.message });
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer la note de ${etudiant.nom_complet} ?`)) return;
    setRetour(null);
    setEnCours(true);
    try {
      await appelApi(chemin, { methode: 'DELETE', token });
      setValeur('');
      setCommentaire('');
      setRetour({ ok: true, texte: 'Note supprimée' });
    } catch (e) {
      setRetour({ ok: false, texte: e.message });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <tr>
      <td>{etudiant.nom_complet}</td>
      <td className="colonne-note">
        <input
          type="number"
          min="0"
          max="20"
          step="0.5"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          maxLength={500}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        />
      </td>
      <td>
        <div className="actions">
          <button onClick={enregistrer} disabled={enCours || valeur === ''}>
            Enregistrer
          </button>
          {etudiant.note && (
            <button className="danger" onClick={supprimer} disabled={enCours}>
              Supprimer
            </button>
          )}
        </div>
        {retour && (
          <small className={retour.ok ? 'ok' : 'erreur'}>{retour.texte}</small>
        )}
      </td>
    </tr>
  );
}

function ListeEtudiants({ coursId }) {
  const { donnees, erreur } = useApi(`/professeur/cours/${coursId}/etudiants`);

  if (erreur) return <p className="erreur">{erreur}</p>;
  if (!donnees) return <p>Chargement...</p>;
  if (donnees.etudiants.length === 0) {
    return <p>Aucun étudiant inscrit à ce cours.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Étudiant</th>
          <th>Note / 20</th>
          <th>Commentaire</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {donnees.etudiants.map((e) => (
          <LigneEtudiant key={e.etudiant_id} coursId={coursId} etudiant={e} />
        ))}
      </tbody>
    </table>
  );
}

export default function Teacher() {
  const { donnees: cours, erreur } = useApi('/professeur/mes-cours');
  const [choisi, setChoisi] = useState(null);

  return (
    <Layout titre="Mes cours">
      {erreur && <p className="erreur">{erreur}</p>}
      {!cours && !erreur && <p>Chargement...</p>}
      {cours && cours.length === 0 && <p>Aucun cours ne vous est attribué.</p>}

      {cours && cours.length > 0 && (
        <div className="onglets">
          {cours.map((c) => (
            <button
              key={c.id}
              className={c.id === choisi ? '' : 'secondaire'}
              onClick={() => setChoisi(c.id)}
            >
              {c.code} — {c.titre}
            </button>
          ))}
        </div>
      )}

      {choisi && <ListeEtudiants key={choisi} coursId={choisi} />}
    </Layout>
  );
}