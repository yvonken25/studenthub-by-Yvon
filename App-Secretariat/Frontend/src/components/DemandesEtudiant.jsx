import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { appelApi } from '../services/api';
import { LIBELLE_STATUT } from '../auth/roles';

export default function DemandesEtudiant() {
  const { token } = useAuth();
  const { donnees: demandes, erreur, recharger } = useApi('/etudiant/mes-demandes');
  const [objet, setObjet] = useState('');
  const [message, setMessage] = useState('');
  const [retour, setRetour] = useState(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e) {
    e.preventDefault();
    setRetour(null);
    setEnCours(true);
    try {
      await appelApi('/etudiant/mes-demandes', {
        methode: 'POST',
        corps: { objet, message },
        token,
      });
      setObjet('');
      setMessage('');
      setRetour({ ok: true, texte: 'Demande envoyée' });
      recharger();
    } catch (err) {
      setRetour({ ok: false, texte: err.message });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <form className="formulaire" onSubmit={envoyer}>
        <label>
          Objet
          <input
            type="text"
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            placeholder="Ex. : attestation de fréquentation"
            minLength={3}
            maxLength={120}
            required
          />
        </label>
        <label>
          Détails (facultatif)
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
          />
        </label>
        <div className="actions">
          <button type="submit" disabled={enCours}>
            Envoyer la demande
          </button>
          {retour && (
            <small className={retour.ok ? 'ok' : 'erreur'}>{retour.texte}</small>
          )}
        </div>
      </form>

      {erreur && <p className="erreur">{erreur}</p>}
      {!demandes && !erreur && <p>Chargement...</p>}
      {demandes && demandes.length === 0 && <p>Aucune demande pour le moment.</p>}
      {demandes && demandes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Objet</th>
              <th>Statut</th>
              <th>Réponse du secrétariat</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td>{new Date(d.cree_le).toLocaleDateString('fr-BE')}</td>
                <td>{d.objet}</td>
                <td>
                  <span className={`badge ${d.statut}`}>{LIBELLE_STATUT[d.statut]}</span>
                </td>
                <td>{d.reponse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}