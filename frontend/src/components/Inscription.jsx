import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAPI, setSession } from "../services/api";

export default function Inscription() {
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [role, setRole] = useState("visiteur");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);
    const nav = useNavigate();

    async function soumettre(e) {
        e.preventDefault();
        setErreur("");

        if (password !== confirmation) {
            setErreur("Les mots de passe ne correspondent pas.");
            return;
        }

        setChargement(true);
        try {
            const session = await AuthAPI.register({
                nom,
                prenom,
                email,
                password,
                role,
            });
            setSession(session.token, session.visiteur);
            nav("/");
        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

    return (
        <main className="page-connexion">
            <form className="login inscription" onSubmit={soumettre}>
                <h1>Créer votre compte</h1>
                <p className="auth-intro">
                    Choisissez votre profil.
                </p>
                <div className="auth-fields">
                    <label>
                        Prénom
                        <input
                            type="text"
                            autoComplete="given-name"
                            value={prenom}
                            onChange={(e) => setPrenom(e.target.value)}
                            maxLength={80}
                            required
                        />
                    </label>
                    <label>
                        Nom
                        <input
                            type="text"
                            autoComplete="family-name"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            maxLength={80}
                            required
                        />
                    </label>
                </div>
                <label>
                    Adresse e-mail
                    <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Rôle
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="visiteur">Visiteur — créer ses notes de frais</option>
                        <option value="comptable">Comptable — gérer les notes de frais</option>
                    </select>
                </label>
                <label>
                    Mot de passe
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />
                </label>
                <label>
                    Confirmer le mot de passe
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        minLength={8}
                        required
                    />
                </label>
                {erreur && <p className="erreur" role="alert">{erreur}</p>}
                <button type="submit" disabled={chargement}>
                    {chargement ? "Création du compte…" : "Créer mon compte"}
                </button>
                <p className="auth-link">
                    Déjà inscrit ? <Link to="/login">Se connecter</Link>
                </p>
            </form>
        </main>
    );
}
