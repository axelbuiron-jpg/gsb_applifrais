import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI, setSession } from "../services/api";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);
    const nav = useNavigate();

    async function soumettre(e) {
        e.preventDefault();
        setErreur("");
        setChargement(true);
        try {
            const { token, visiteur } = await AuthAPI.login(email, password);
            setSession(token, visiteur);
            nav("/");
        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

    return (
        <main>
            <form className="login" onSubmit={soumettre}>
                <h1>GSB AppliFrais</h1>
                <label>
                    Email
                    <input
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Mot de passe
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                {erreur && <p className="erreur" role="alert">{erreur}</p>}
                <button type="submit" disabled={chargement}>
                    {chargement ? "Connexion…" : "Se connecter"}
                </button>
            </form>
        </main>
    );
}
