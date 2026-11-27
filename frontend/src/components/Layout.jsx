import { NavLink, Outlet, Link } from "react-router-dom";
import { getVisiteur, logout } from "../services/api";

export default function Layout() {
    const v = getVisiteur();
    return (
        <>
            <header className={`barre${v?.role === "visiteur" ? " barre-visiteur" : ""}`}>
                <Link to="/">GSB AppliFrais</Link>
                {v?.role === "comptable" && (
                    <NavLink
                        to="/statistiques"
                        className={({ isActive }) =>
                            `lien-statistiques${isActive ? " actif" : ""}`}
                    >
                        Statistiques
                    </NavLink>
                )}
                <span>{v?.prenom} {v?.nom} — {v?.role}</span>
                <button onClick={logout}>Déconnexion</button>
            </header>
            <main><Outlet /></main>
        </>
    );
}
