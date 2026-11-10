const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function appelApi(chemin, { methode = 'GET', corps, token } = {}) {
  let reponse;
  try {
    reponse = await fetch(`${API_URL}${chemin}`, {
      method: methode,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corps ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new Error('Serveur injoignable');
  }

  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    const erreur = new Error(donnees.erreur || 'Erreur serveur');
    erreur.statut = reponse.status;
    throw erreur;
  }
  return donnees;
}