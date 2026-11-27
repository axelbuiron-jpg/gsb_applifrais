import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FichesAPI, getVisiteur } from "../services/api";

const ETAT = {
    CR: "Créée",
    CL: "Clôturée",
    VA: "Validée",
    MP: "Mise en paiement",
    RB: "Remboursée",
};

export default function Liste() {
    const [fiches, setFiches] = useState([]);
    const [erreur, setErreur] = useState("");
    const [suppression, setSuppression] = useState("");
    const [chargement, setChargement] = useState(true);
    const role = getVisiteur()?.role;

    useEffect(() => {
        let actif = true;
        FichesAPI.lister()
            .then((resultat) => {
                if (actif) setFiches(resultat);
            })
            .catch((err) => {
                if (actif) setErreur(err.message);
            })
            .finally(() => {
                if (actif) setChargement(false);
            });

        return () => {
            actif = false;
        };
    }, []);

    async function supprimer(fiche) {
        if (!window.confirm(`Supprimer la fiche de ${fiche.mois} ?`)) return;
        setErreur("");
        setSuppression(fiche._id);
        try {
            await FichesAPI.supprimer(fiche._id);
            setFiches((courantes) => courantes.filter((courante) => courante._id !== fiche._id));
        } catch (err) {
            setErreur(err.message);
        } finally {
            setSuppression("");
        }
    }

    return (
        <section>
            <h1>{role === "comptable" ? "Toutes les fiches" : "Mes fiches"}</h1>
            {erreur && <p className="banniere-erreur" role="alert">{erreur}</p>}
            {role === "visiteur" && (
                <Link className="bouton" to="/fiches/nouvelle">Créer une note de frais</Link>
            )}
            {chargement ? <p>Chargement des fiches…</p> : (
                <table>
                    <thead>
                        <tr>
                            <th>Mois</th>
                            {role === "comptable" && <th>Visiteur</th>}
                            <th>État</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {fiches.map((f) => (
                            <tr key={f._id}>
                                <td>{f.mois}</td>
                                {role === "comptable" && (
                                    <td>{f.visiteur?.prenom} {f.visiteur?.nom}</td>
                                )}
                                <td>{ETAT[f.etat] || f.etat}</td>
                                <td>{f.total?.toFixed(2)} €</td>
                                <td className="actions-fiche">
                                    <Link to={`/fiches/${f._id}`}>Ouvrir</Link>
                                    {role === "visiteur" && f.etat === "CR" && (
                                        <button
                                            type="button"
                                            className="bouton-suppression"
                                            onClick={() => supprimer(f)}
                                            disabled={suppression === f._id}
                                        >
                                            {suppression === f._id ? "Suppression…" : "Supprimer"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}