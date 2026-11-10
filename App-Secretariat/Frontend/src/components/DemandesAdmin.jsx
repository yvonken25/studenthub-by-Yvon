import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { appelApi } from '../services/api';
import { LIBELLE_STATUT } from '../auth/roles';

function LigneDemande({ demande, onTraitee }) {
  const { token } = useAuth();
  const [reponse, setReponse] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function decider(statut) {
    setErreur('');
    setEnCours(true);
    try {
      await appelApi(`/admin/demandes/${demande.id}`, {
        methode: 'PATCH',
        corps: { statut, reponse },
        token,
      });
      onTraitee();
    } catch (e) {
      setErreur(e.message);
      setEnCours(false);
    }
  }

  return (
    <tr>
      <td>{demande.etudiant}</td>
      <td>
        <strong>{demande.objet}</strong>
        {demande.message && <div className="detail">{demande.message}</div>}
      </td>
      <td>{new Date(demande.cree_le).toLocaleDateString('fr-BE')}</td>
      <td>
        <span className={`badge ${demande.statut}`}>{LIBELLE_STATUT[demande.statut]}</span>
      </td>
      <td>
        {demande.statut === 'en_attente' ? (
          <>
            <input
              type="text"
              placeholder="Réponse ou motif du refus"
              maxLength={500}
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
            />
            <div className="actions">
              <button onClick={() => decider('acceptee')} disabled={enCours}>
                Accepter
              </button>
              <button className="danger" onClick={() => decider('refusee')} disabled={enCours}>
                Refuser
              </button>
            </div>
            {erreur && <small className="erreur">{erreur}</small>}
          </>
        ) : (
          demande.reponse
        )}
      </td>
    </tr>
  );
}

export default function DemandesAdmin() {
  const [filtre, setFiltre] = useState('en_attente');
  const chemin = filtre ? `/admin/demandes?statut=${filtre}` : '/admin/demandes';
  const { donnees: demandes, erreur, recharger } = useApi(chemin);

  return (
    <>
      <div className="onglets">
        <button className={filtre === 'en_attente' ? '' : 'secondaire'} onClick={() => setFiltre('en_attente')}>
          En attente
        </button>
        <button className={filtre === '' ? '' : 'secondaire'} onClick={() => setFiltre('')}>
          Toutes
        </button>
      </div>

      {erreur && <p className="erreur">{erreur}</p>}
      {!demandes && !erreur && <p>Chargement...</p>}
      {demandes && demandes.length === 0 && <p>Aucune demande.</p>}
      {demandes && demandes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Étudiant</th>
              <th>Demande</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Traitement</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <LigneDemande key={d.id} demande={d} onTraitee={recharger} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}