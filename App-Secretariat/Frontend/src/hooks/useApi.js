import { useEffect, useState } from 'react';
import { appelApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export function useApi(chemin) {
  const { token, seDeconnecter } = useAuth();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let actif = true;
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
  }, [chemin, token, seDeconnecter]);

  return { donnees, erreur };
}