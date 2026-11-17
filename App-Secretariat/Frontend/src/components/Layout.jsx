import { useAuth } from '../auth/AuthContext';
import { LIBELLE_ROLE } from '../auth/roles';

export default function Layout({ titre, children }) {
  const { utilisateur, seDeconnecter } = useAuth();
  const initiale = (utilisateur.nom_complet || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="page">
      <header className="entete">
        <div className="marque">
          <span className="logo">S</span>
          <strong>StudentHub</strong>
          <span className="role">{LIBELLE_ROLE[utilisateur.role]}</span>
        </div>
        <div className="utilisateur">
          <span className="avatar">{initiale}</span>
          <span className="nom">{utilisateur.nom_complet}</span>
          <button className="secondaire" onClick={seDeconnecter}>
            Déconnexion
          </button>
        </div>
      </header>
      <main className="contenu">
        <h1>{titre}</h1>
        {children}
      </main>
    </div>
  );
}