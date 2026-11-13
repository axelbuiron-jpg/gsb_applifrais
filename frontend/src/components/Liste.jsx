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
    const [mois, setMois] = useState("");
    const [chargement, setChargement] = useState(true);
    const role = getVisiteur()?.role;

    async function charger() {
        try {
            setFiches(await FichesAPI.lister());
        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

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

    async function creer(e) {
        e.preventDefault();
        setErreur("");
        try {
            await FichesAPI.creer(mois);
            setMois("");
            await charger();
        } catch (err) {
            setErreur(err.message);
        }
    }

    return (
        <section>
            <h1>{role === "comptable" ? "Toutes les fiches" : "Mes fiches"}</h1>
            {erreur && <p className="banniere-erreur" role="alert">{erreur}</p>}
            {role === "visiteur" && (
                <form onSubmit={creer}>
                    <label>
                        Mois
                        <input
                            type="month"
                            value={mois}
                            onChange={(e) => setMois(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit">Nouvelle fiche</button>
                </form>
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
                                <td><Link to={`/fiches/${f._id}`}>Ouvrir</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}