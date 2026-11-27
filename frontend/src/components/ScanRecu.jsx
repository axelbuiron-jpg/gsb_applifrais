import { useState } from "react";
import { FichesAPI } from "../services/api";

export default function ScanRecu({ onResult }) {
    const [image, setImage] = useState(null);
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");
    const [analyseEnCours, setAnalyseEnCours] = useState(false);

    async function analyser() {
        if (!image) {
            setErreur("Choisissez une image de reçu.");
            return;
        }

        setErreur("");
        setMessage("");
        setAnalyseEnCours(true);
        try {
            const resultat = await FichesAPI.analyser(image);
            onResult(resultat.proposition);
            setMessage(`Analyse terminée (${resultat.confiance} % de confiance). Vérifiez les champs avant l’enregistrement.`);
        } catch (err) {
            setErreur(err.message);
        } finally {
            setAnalyseEnCours(false);
        }
    }

    return (
        <div className="scan-recu">
            <label>
                Scanner un reçu (image, 5 Mo maximum, non conservée)
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={(e) => {
                        setImage(e.target.files?.[0] || null);
                        setErreur("");
                        setMessage("");
                    }}
                />
            </label>
            <button type="button" onClick={analyser} disabled={!image || analyseEnCours}>
                {analyseEnCours ? "Analyse en cours…" : "Analyser le reçu"}
            </button>
            {erreur && <p role="alert">{erreur}</p>}
            {message && <p role="status">{message}</p>}
        </div>
    );
}
