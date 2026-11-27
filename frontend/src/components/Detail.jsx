import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FichesAPI, getVisiteur } from "../services/api";
import ScanRecu from "./ScanRecu";

const ligneInitiale = { date: "", libelle: "", montant: "", justificatif: undefined };
const ETATS = {
    CR: "Créée",
    CL: "Clôturée",
    VA: "Validée",
    MP: "Mise en paiement",
    RB: "Remboursée",
};

export default function Detail() {
    const { id } = useParams();
    const [fiche, setFiche] = useState(null);
    const [ligne, setLigne] = useState(ligneInitiale);
    const [nouvelEtat, setNouvelEtat] = useState("");
    const [info, setInfo] = useState("");
    const [idCharge, setIdCharge] = useState(null);
    const role = getVisiteur()?.role;

    useEffect(() => {
        let actif = true;

        FichesAPI.lire(id)
            .then((resultat) => {
                if (actif) {
                    setFiche(resultat);
                    setNouvelEtat(resultat.etat);
                    setInfo("");
                    setIdCharge(id);
                }
            })
            .catch((err) => {
                if (actif) {
                    setFiche(null);
                    setInfo(err.message);
                    setIdCharge(id);
                }
            });

        return () => {
            actif = false;
        };
    }, [id]);

    async function action(promesse) {
        setInfo("");
        try {
            const maj = await promesse();
            setFiche(maj);
            setNouvelEtat(maj.etat);
        } catch (err) {
            setInfo(err.message);
        }
    }

    async function ajouter(e) {
        e.preventDefault();
        setInfo("");
        try {
            const maj = await FichesAPI.ajouterLigne(id, ligne);
            setFiche(maj);
            setLigne(ligneInitiale);
        } catch (err) {
            setInfo(err.message);
        }
    }

    if (idCharge !== id) return <p>Chargement…</p>;
    if (!fiche) return <p role="alert">{info || "Fiche introuvable."}</p>;

    return (
        <section className="detail" translate="no">
            <h1>Fiche {fiche.mois} — {fiche.visiteur?.prenom} {fiche.visiteur?.nom}</h1>
            <p>État : <b>{fiche.etat}</b> · Total : <b>{fiche.total?.toFixed(2)} €</b></p>

            {info && <p role="alert">{info}</p>}

            <h2>Frais forfaitisés</h2>
            <ul>
                {(fiche.lignesForfait || []).map((l, i) => (
                    <li key={`${l.codeType}-${i}`}>{l.codeType} × {l.quantite}</li>
                ))}
            </ul>

            <h2>Frais hors forfait</h2>
            <ul>
                {(fiche.lignesHorsForfait || []).map((l) => (
                    <li key={l._id}>
                        {new Date(l.date).toLocaleDateString()} — {l.libelle} — {l.montant} €
                    </li>
                ))}
            </ul>

            {fiche.etat === "CR" && role === "visiteur" && (
                <>
                    <form onSubmit={ajouter}>
                        <h2>Ajouter un frais hors forfait</h2>
                        <ScanRecu onResult={(proposition) => setLigne((courante) => ({
                            ...courante,
                            date: proposition.date || courante.date,
                            libelle: proposition.libelle || courante.libelle,
                            montant: proposition.montant ?? courante.montant,
                            justificatif: undefined,
                        }))} />
                        <label>
                            Date
                            <input
                                type="date"
                                value={ligne.date}
                                onChange={(e) => setLigne({ ...ligne, date: e.target.value })}
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                required
                            />
                        </label>
                        <label>
                            Libellé
                            <input
                                type="text"
                                value={ligne.libelle}
                                onChange={(e) => setLigne({ ...ligne, libelle: e.target.value })}
                                maxLength={100}
                                required
                            />
                        </label>
                        <label>
                            Montant
                            <input
                                type="number"
                                value={ligne.montant}
                                onChange={(e) => setLigne({ ...ligne, montant: e.target.value })}
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </label>
                        <button type="submit">Ajouter</button>
                    </form>
                    <button onClick={() => action(() => FichesAPI.cloturer(fiche._id))}>
                        Clôturer
                    </button>
                </>
            )}

            {role === "comptable" && (
                <form onSubmit={(e) => {
                    e.preventDefault();
                    action(() => FichesAPI.changerEtat(fiche._id, nouvelEtat));
                }}>
                    <label>
                        Modifier le statut
                        <select
                            value={nouvelEtat}
                            onChange={(e) => setNouvelEtat(e.target.value)}
                        >
                            {Object.entries(ETATS)
                                .filter(([etat]) => fiche.etat === "CR" || etat !== "CR")
                                .map(([etat, libelle]) => (
                                    <option key={etat} value={etat}>{libelle}</option>
                                ))}
                        </select>
                    </label>
                    <button type="submit" disabled={nouvelEtat === fiche.etat}>
                        Enregistrer le statut
                    </button>
                </form>
            )}
        </section>
    );
}
