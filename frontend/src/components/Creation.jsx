import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FichesAPI, getVisiteur } from "../services/api";
import ScanRecu from "./ScanRecu";

const TYPES_FORFAIT = [
    { codeType: "KM", libelle: "Kilométrage (KM)" },
    { codeType: "EF", libelle: "Frais forfaitaires (EF)" },
    { codeType: "NUI", libelle: "Nuitées (NUI)" },
    { codeType: "REP", libelle: "Repas (REP)" },
];

const ligneVide = () => ({ date: "", libelle: "", montant: "", justificatif: undefined });

export default function Creation() {
    const navigate = useNavigate();
    const [mois, setMois] = useState("");
    const [quantites, setQuantites] = useState({ KM: "", EF: "", NUI: "", REP: "" });
    const [lignesHorsForfait, setLignesHorsForfait] = useState([]);
    const [erreur, setErreur] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const role = getVisiteur()?.role;

    function modifierLigne(index, champ, valeur) {
        setLignesHorsForfait((lignes) => lignes.map((ligne, i) =>
            i === index ? { ...ligne, [champ]: valeur } : ligne));
    }

    function appliquerProposition(index, proposition) {
        setLignesHorsForfait((lignes) => lignes.map((ligne, i) => i === index
            ? {
                ...ligne,
                date: proposition.date || ligne.date,
                libelle: proposition.libelle || ligne.libelle,
                montant: proposition.montant ?? ligne.montant,
                justificatif: undefined,
            }
            : ligne));
    }

    async function creer(e) {
        e.preventDefault();
        setErreur("");
        const lignesForfait = TYPES_FORFAIT
            .filter(({ codeType }) => Number(quantites[codeType]) > 0)
            .map(({ codeType }) => ({
                codeType,
                quantite: Number(quantites[codeType]),
            }));

        if (lignesForfait.length === 0 && lignesHorsForfait.length === 0) {
            setErreur("Ajoutez au moins une dépense avant de créer la note.");
            return;
        }

        setEnvoi(true);
        try {
            const fiche = await FichesAPI.creer({
                mois,
                lignesForfait,
                lignesHorsForfait: lignesHorsForfait.map((ligne) => ({
                    ...ligne,
                    montant: Number(ligne.montant),
                })),
            });
            navigate(`/fiches/${fiche._id}`);
        } catch (err) {
            setErreur(err.message);
        } finally {
            setEnvoi(false);
        }
    }

    if (role !== "visiteur") return <Navigate to="/" replace />;

    return (
        <section className="detail creation">
            <h1>Créer une note de frais</h1>
            {erreur && <p role="alert">{erreur}</p>}
            <form onSubmit={creer}>
                <label>
                    Mois de la note
                    <input
                        type="month"
                        value={mois}
                        onChange={(e) => setMois(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        required
                    />
                </label>

                <h2>Frais forfaitisés</h2>
                <div className="creation-forfaits">
                    {TYPES_FORFAIT.map(({ codeType, libelle }) => (
                        <label key={codeType}>
                            {libelle}
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={quantites[codeType]}
                                onChange={(e) => setQuantites({
                                    ...quantites,
                                    [codeType]: e.target.value,
                                })}
                                placeholder="Quantité (0 si aucun)"
                            />
                        </label>
                    ))}
                </div>

                <h2>Frais hors forfait</h2>
                {lignesHorsForfait.map((ligne, index) => (
                    <div className="creation-depense" key={index}>
                        <label>
                            Date
                            <input
                                type="date"
                                value={ligne.date}
                                onChange={(e) => modifierLigne(index, "date", e.target.value)}
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                required
                            />
                        </label>
                        <label>
                            Libellé
                            <input
                                type="text"
                                value={ligne.libelle}
                                onChange={(e) => modifierLigne(index, "libelle", e.target.value)}
                                maxLength={100}
                                required
                            />
                        </label>
                        <label>
                            Montant (€)
                            <input
                                type="number"
                                value={ligne.montant}
                                onChange={(e) => modifierLigne(index, "montant", e.target.value)}
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </label>
                        <ScanRecu onResult={(proposition) =>
                            appliquerProposition(index, proposition)} />
                        <button
                            type="button"
                            className="bouton-suppression"
                            onClick={() => setLignesHorsForfait((lignes) =>
                                lignes.filter((_, i) => i !== index))}
                        >
                            Retirer ce frais
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="bouton-secondaire"
                    onClick={() => setLignesHorsForfait((lignes) => [...lignes, ligneVide()])}
                >
                    Ajouter un frais hors forfait
                </button>

                <div className="creation-actions">
                    <button type="submit" disabled={envoi}>
                        {envoi ? "Création…" : "Créer la note de frais"}
                    </button>
                    <Link to="/">Annuler</Link>
                </div>
            </form>
        </section>
    );
}
