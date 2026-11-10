import Layout from '../components/Layout';
import { useApi } from '../hooks/useApi';

export default function Student() {
  const { donnees: notes, erreur } = useApi('/etudiant/mes-notes');

  return (
    <Layout titre="Mes notes">
      {erreur && <p className="erreur">{erreur}</p>}
      {!notes && !erreur && <p>Chargement...</p>}
      {notes && notes.length === 0 && <p>Aucune note pour le moment.</p>}
      {notes && notes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Cours</th>
              <th>Note</th>
              <th>Commentaire</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n, i) => (
              <tr key={i}>
                <td>{n.cours ? `${n.cours.code} — ${n.cours.titre}` : n.cours_id}</td>
                <td>{n.valeur} / 20</td>
                <td>{n.commentaire}</td>
                <td>{new Date(n.cree_le).toLocaleDateString('fr-BE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}