import { useApi } from '../hooks/useApi';
import { LIBELLE_STATUT } from '../auth/roles';

const pluriel = (n, un, plusieurs) => (n > 1 ? plusieurs : un);

function Stat({ valeur, libelle, detail, ton = '' }) {
  return (
    <div className={`stat ${ton}`}>
      <div className="stat-valeur">{valeur}</div>
      <div className="stat-libelle">{libelle}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </div>
  );
}

export default function TableauDeBord({ allerA }) {
  const { donnees: s, erreur, recharger } = useApi('/admin/statistiques');

  if (erreur) return <p className="erreur">{erreur}</p>;
  if (!s) return <p>Chargement...</p>;

  const dem = s.demandes;
  const totalDemandes = dem.en_attente + dem.acceptee + dem.refusee;
  const maxEffectif = Math.max(1, ...s.cours_populaires.map((c) => c.etudiants));

  const alertes = [];
  if (dem.en_attente > 0) {
    alertes.push({
      id: 'demandes',
      texte: `${dem.en_attente} ${pluriel(dem.en_attente, 'demande est', 'demandes sont')} en attente de traitement`,
      libelle: 'Traiter',
      cible: 'demandes',
    });
  }
  if (s.cours.sans_professeur > 0) {
    const n = s.cours.sans_professeur;
    alertes.push({
      id: 'cours',
      texte: `${n} ${pluriel(n, 'cours n’a', 'cours n’ont')} pas de professeur`,
      libelle: 'Assigner',
      cible: 'cours',
    });
  }

  return (
    <>
      <div className="entete-section">
        <p className="sous-titre">Vue d’ensemble de l’application</p>
        <button className="secondaire" onClick={recharger}>Actualiser</button>
      </div>

      <div className="grille-stats">
        <Stat valeur={s.utilisateurs.etudiants} libelle="Étudiants" />
        <Stat valeur={s.utilisateurs.professeurs} libelle="Professeurs" />
        <Stat valeur={s.cours.total} libelle="Cours" />
        <Stat valeur={s.inscriptions} libelle="Inscriptions" />
        <Stat
          valeur={s.notes.total}
          libelle="Notes saisies"
          detail={s.notes.moyenne !== null ? `Moyenne : ${s.notes.moyenne} / 20` : 'Aucune note'}
        />
        <Stat
          valeur={dem.en_attente}
          libelle="Demandes en attente"
          ton={dem.en_attente > 0 ? 'attention' : ''}
        />
      </div>

      <div className="grille-2">
        <section className="bloc">
          <h2>À surveiller</h2>
          {alertes.length === 0 ? (
            <p className="vide">Rien à signaler.</p>
          ) : (
            <ul className="liste-simple">
              {alertes.map((a) => (
                <li key={a.id}>
                  <span>{a.texte}</span>
                  <button className="secondaire" onClick={() => allerA(a.cible)}>
                    {a.libelle}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bloc">
          <h2>Demandes au secrétariat</h2>
          {totalDemandes === 0 ? (
            <p className="vide">Aucune demande pour le moment.</p>
          ) : (
            <>
              <div className="barre-empilee">
                {['en_attente', 'acceptee', 'refusee'].map(
                  (k) =>
                    dem[k] > 0 && (
                      <div
                        key={k}
                        className={`segment ${k}`}
                        style={{ flex: dem[k] }}
                        title={`${LIBELLE_STATUT[k]} : ${dem[k]}`}
                      />
                    )
                )}
              </div>
              <ul className="legende">
                {['en_attente', 'acceptee', 'refusee'].map((k) => (
                  <li key={k}>
                    <i className={`segment ${k}`} />
                    {LIBELLE_STATUT[k]} : <strong>{dem[k]}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="bloc">
          <h2>Cours les plus suivis</h2>
          {s.cours_populaires.length === 0 ? (
            <p className="vide">Aucun cours.</p>
          ) : (
            <ul className="barres">
              {s.cours_populaires.map((c) => (
                <li key={c.id}>
                  <div className="barres-libelle">
                    <span>{c.code} — {c.titre}</span>
                    <strong>{c.etudiants}</strong>
                  </div>
                  <div className="barres-piste">
                    <div
                      className="barres-remplissage"
                      style={{ width: `${(c.etudiants / maxEffectif) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bloc">
          <h2>Dernières demandes</h2>
          {s.demandes_recentes.length === 0 ? (
            <p className="vide">Aucune demande.</p>
          ) : (
            <ul className="liste-simple">
              {s.demandes_recentes.map((d) => (
                <li key={d.id}>
                  <div>
                    <strong>{d.objet}</strong>
                    <div className="detail">
                      {d.etudiant} · {new Date(d.cree_le).toLocaleDateString('fr-BE')}
                    </div>
                  </div>
                  <span className={`badge ${d.statut}`}>{LIBELLE_STATUT[d.statut]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}