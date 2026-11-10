import Layout from '../components/Layout';
import DemandesAdmin from '../components/DemandesAdmin';
import { useApi } from '../hooks/useApi';
import { LIBELLE_ROLE } from '../auth/roles';

export default function Admin() {
  const { donnees: profils, erreur } = useApi('/admin/profils');

  return (
    <Layout titre="Supervision générale">
      <h2>Demandes au secrétariat</h2>
      <DemandesAdmin />

      <h2>Utilisateurs</h2>
      {erreur && <p className="erreur">{erreur}</p>}
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
                <td>{LIBELLE_ROLE[p.role]}</td>
                <td>{new Date(p.cree_le).toLocaleDateString('fr-BE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}