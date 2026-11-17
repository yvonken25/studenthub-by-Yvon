import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { appelApi } from '../services/api';
import { LIBELLE_ROLE } from '../auth/roles';

export default function UtilisateursAdmin() {
  const { token, utilisateur } = useAuth();
  const { donnees: profils, erreur, recharger } = useApi('/admin/profils');
  const [retour, setRetour] = useState(null);

  async function changerRole(p, role) {
    if (!window.confirm(`Passer ${p.nom_complet} au rôle « ${LIBELLE_ROLE[role]} » ?`)) return;
    setRetour(null);
    try {
      await appelApi(`/admin/profils/${p.id}/role`, {
        methode: 'PATCH',
        corps: { role },
        token,
      });
      recharger();
    } catch (err) {
      setRetour(err.message);
    }
  }

  return (
    <>
      {erreur && <p className="erreur">{erreur}</p>}
      {retour && <p className="erreur">{retour}</p>}
      {!profils && !erreur && <p>Chargement...</p>}
      {profils && (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {profils.map((p) => (
              <tr key={p.id}>
                <td>{p.nom_complet}</td>
                <td>
                  <select value={p.role}
                          disabled={p.id === utilisateur.id}
                          onChange={(e) => changerRole(p, e.target.value)}>
                    {Object.entries(LIBELLE_ROLE).map(([valeur, libelle]) => (
                      <option key={valeur} value={valeur}>{libelle}</option>
                    ))}
                  </select>
                </td>
                <td>{new Date(p.cree_le).toLocaleDateString('fr-BE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}