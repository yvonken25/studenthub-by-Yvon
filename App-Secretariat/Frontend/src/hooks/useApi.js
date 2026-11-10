import { useCallback, useEffect, useState } from 'react';
import { appelApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export function useApi(chemin) {
  const { token, seDeconnecter } = useAuth();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');
  const [version, setVersion] = useState(0);

  const recharger = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let actif = true;
    setErreur('');
    appelApi(chemin, { token })
      .then((d) => actif && setDonnees(d))
      .catch((e) => {
        if (!actif) return;
        if (e.statut === 401) seDeconnecter(); // token expire
        else setErreur(e.message);
      });
    return () => {
      actif = false;
    };
  }, [chemin, token, seDeconnecter, version]);

  return { donnees, erreur, recharger };
}