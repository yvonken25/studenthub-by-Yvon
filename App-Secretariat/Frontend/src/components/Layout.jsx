import { useAuth } from '../auth/AuthContext';
import { LIBELLE_ROLE } from '../auth/roles';

export default function Layout({ titre, children }) {
  const { utilisateur, seDeconnecter } = useAuth();

  return (
    <div className="page">
      <header className="entete">
        <div>
          <strong>StudentHub</strong>
          <span className="role">{LIBELLE_ROLE[utilisateur.role]}</span>
        </div>
        <div>
          <span>{utilisateur.nom_complet}</span>
          <button onClick={seDeconnecter}>Déconnexion</button>
        </div>
      </header>
      <main className="contenu">
        <h1>{titre}</h1>
        {children}
      </main>
    </div>
  );
}