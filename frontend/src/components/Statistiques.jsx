import { useEffect, useState } from "react";
import { StatsAPI } from "../services/api";

const COULEURS = ["#7651c9", "#f08a4b", "#348a77", "#dfbd45", "#5690cf"];
const FILTRES_VIDES = { mois: "", visiteur: "", etat: "" };

function formaterMontant(montant) {
    return `${montant.toFixed(2)} €`;
}

function formaterMois(mois) {
    return new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${mois}-01T00:00:00Z`));
}

function creerFondDonut(types) {
    const total = types.reduce((somme, type) => somme + type.total, 0);
    if (!total) return "conic-gradient(#e8e2f1 0deg 360deg)";

    const segments = types.map((type, index) => {
        const debut = types.slice(0, index)
            .reduce((somme, precedent) => somme + precedent.total, 0);
        const fin = debut + type.total;
        const debutDegres = (debut / total) * 360;
        const finDegres = (fin / total) * 360;
        return `${COULEURS[index % COULEURS.length]} ${debutDegres}deg ${finDegres}deg`;
    });

    return `conic-gradient(${segments.join(", ")})`;
}

export default function Statistiques() {
    const [reponse, setReponse] = useState({ cle: null, stats: null, erreur: "" });
    const [options, setOptions] = useState({ mois: [], visiteurs: [], etats: [] });
    const [filtres, setFiltres] = useState(FILTRES_VIDES);
    const cleFiltres = `${filtres.mois}|${filtres.visiteur}|${filtres.etat}`;

    useEffect(() => {
        let actif = true;

        StatsAPI.lire(filtres)
            .then((resultat) => {
                if (actif) {
                    setOptions(resultat.options);
                    setReponse({ cle: cleFiltres, stats: resultat, erreur: "" });
                }
            })
            .catch((err) => {
                if (actif) setReponse({ cle: cleFiltres, stats: null, erreur: err.message });
            });

        return () => {
            actif = false;
        };
    }, [filtres, cleFiltres]);

    function modifierFiltre(event) {
        const { name, value } = event.target;
        setFiltres((courants) => ({ ...courants, [name]: value }));
    }

    const reponseCourante = reponse.cle === cleFiltres;
    const stats = reponseCourante ? reponse.stats : null;
    const erreur = reponseCourante ? reponse.erreur : "";
    const chargement = !reponseCourante;
    const maximum = stats ? Math.max(...stats.types.map((type) => type.total), 0) : 0;
    const totalRepartition = stats?.types.reduce((somme, type) => somme + type.total, 0) || 0;
    const donutBackground = stats ? creerFondDonut(stats.types) : undefined;

    return (
        <section className="statistiques">
            <h1>Statistiques des notes de frais</h1>
            {erreur && <p className="banniere-erreur" role="alert">{erreur}</p>}
            <div className="filtres-statistiques" aria-label="Filtres des statistiques">
                <label htmlFor="filtre-mois">
                    Mois
                    <select id="filtre-mois" name="mois" value={filtres.mois} onChange={modifierFiltre}>
                        <option value="">Tous les mois</option>
                        {options.mois.map((mois) => (
                            <option key={mois} value={mois}>{formaterMois(mois)}</option>
                        ))}
                    </select>
                </label>
                <label htmlFor="filtre-visiteur">
                    Visiteur
                    <select
                        id="filtre-visiteur"
                        name="visiteur"
                        value={filtres.visiteur}
                        onChange={modifierFiltre}
                    >
                        <option value="">Tous les visiteurs</option>
                        {options.visiteurs.map((visiteur) => (
                            <option key={visiteur.id} value={visiteur.id}>{visiteur.nom}</option>
                        ))}
                    </select>
                </label>
                <label htmlFor="filtre-etat">
                    Statut de la note
                    <select id="filtre-etat" name="etat" value={filtres.etat} onChange={modifierFiltre}>
                        <option value="">Tous les statuts</option>
                        {options.etats.map((etat) => (
                            <option key={etat.code} value={etat.code}>{etat.libelle}</option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    className="bouton-reinitialiser"
                    onClick={() => setFiltres({ ...FILTRES_VIDES })}
                    disabled={!filtres.mois && !filtres.visiteur && !filtres.etat}
                >
                    Réinitialiser
                </button>
            </div>
            {chargement && <p role="status">Chargement des statistiques…</p>}
            {stats && (
                <>
                    <p className="statistiques-compte" role="status">
                        {stats.nombreNotes} note{stats.nombreNotes > 1 ? "s" : ""} prise{stats.nombreNotes > 1 ? "s" : ""} en compte
                    </p>
                    {stats.nombreNotes === 0 && (
                        <p className="statistiques-vide">Aucune note ne correspond à ces filtres.</p>
                    )}
                    <div className="statistiques-graphiques">
                        <article className="graphique-statistique">
                            <h2>Montant par type de frais</h2>
                            <div className="graphique-barres">
                                {stats.types.map((type, index) => (
                                    <div className="graphique-barre" key={type.code}>
                                        <div className="graphique-barre-entete">
                                            <span>{type.libelle}</span>
                                            <strong>{formaterMontant(type.total)}</strong>
                                        </div>
                                        <div
                                            className="graphique-barre-piste"
                                            role="progressbar"
                                            aria-label={type.libelle}
                                            aria-valuemin="0"
                                            aria-valuemax={maximum || 1}
                                            aria-valuenow={type.total}
                                            aria-valuetext={formaterMontant(type.total)}
                                        >
                                            <span
                                                style={{
                                                    width: maximum ? `${(type.total / maximum) * 100}%` : "0%",
                                                    backgroundColor: COULEURS[index % COULEURS.length],
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="graphique-statistique">
                            <h2>Répartition des frais</h2>
                            <div className="graphique-circulaire">
                                <div
                                    className="graphique-donut"
                                    role="img"
                                    aria-label={`Répartition des frais, total ${formaterMontant(totalRepartition)}`}
                                    style={{ background: donutBackground }}
                                >
                                    <div className="graphique-donut-centre">
                                        <span>Total</span>
                                        <strong>{formaterMontant(totalRepartition)}</strong>
                                    </div>
                                </div>
                                <ul className="graphique-legende">
                                    {stats.types.map((type, index) => (
                                        <li key={type.code}>
                                            <span
                                                className="graphique-legende-point"
                                                style={{ backgroundColor: COULEURS[index % COULEURS.length] }}
                                            />
                                            <span>{type.libelle}</span>
                                            <strong>
                                                {totalRepartition
                                                    ? `${((type.total / totalRepartition) * 100).toFixed(1)} %`
                                                    : "0 %"}
                                            </strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Type de frais</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.types.map((type) => (
                                <tr key={type.code}>
                                    <td>{type.libelle}</td>
                                    <td>{formaterMontant(type.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th>Total final de toutes les notes</th>
                                <td><strong>{formaterMontant(stats.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </>
            )}
        </section>
    );
}
