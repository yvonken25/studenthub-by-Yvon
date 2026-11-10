import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ACCUEIL_PAR_ROLE } from './roles';

export default function RouteProtegee({ role, children }) {
  const { utilisateur } = useAuth();

  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (utilisateur.role !== role) {
    return <Navigate to={ACCUEIL_PAR_ROLE[utilisateur.role]} replace />;
  }
  return children;
}