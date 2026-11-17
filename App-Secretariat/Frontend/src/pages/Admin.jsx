import { useState } from 'react';
import Layout from '../components/Layout';
import DemandesAdmin from '../components/DemandesAdmin';
import GestionCours from '../components/GestionCours';
import UtilisateursAdmin from '../components/UtilisateursAdmin';

const ONGLETS = [
  { id: 'demandes', libelle: 'Demandes' },
  { id: 'cours', libelle: 'Cours' },
  { id: 'utilisateurs', libelle: 'Utilisateurs' },
];

export default function Admin() {
  const [onglet, setOnglet] = useState('demandes');

  return (
    <Layout titre="Supervision générale">
      <div className="onglets">
        {ONGLETS.map((o) => (
          <button key={o.id}
                  className={o.id === onglet ? '' : 'secondaire'}
                  onClick={() => setOnglet(o.id)}>
            {o.libelle}
          </button>
        ))}
      </div>

      {onglet === 'demandes' && <DemandesAdmin />}
      {onglet === 'cours' && <GestionCours />}
      {onglet === 'utilisateurs' && <UtilisateursAdmin />}
    </Layout>
  );
}