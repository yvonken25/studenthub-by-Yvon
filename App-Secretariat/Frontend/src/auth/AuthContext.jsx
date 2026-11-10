import { createContext, useCallback, useContext, useState } from 'react';
import { appelApi } from '../services/api';

const AuthContext = createContext(null);
const CLE = 'studenthub_session';

function lireSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CLE));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(lireSession);

  async function seConnecter(email, motDePasse) {
    const donnees = await appelApi('/auth/login', {
      methode: 'POST',
      corps: { email, mot_de_passe: motDePasse },
    });
    sessionStorage.setItem(CLE, JSON.stringify(donnees));
    setSession(donnees);
  }

  const seDeconnecter = useCallback(() => {
    sessionStorage.removeItem(CLE);
    setSession(null);
  }, []);

  const valeur = {
    utilisateur: session?.utilisateur ?? null,
    token: session?.token ?? null,
    seConnecter,
    seDeconnecter,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}