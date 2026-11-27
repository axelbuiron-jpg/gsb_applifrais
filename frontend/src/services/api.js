const API_URL = import.meta.env.VITE_API_URL; // ex. https://gsb-applifrais-backend.vercel.app/api/v1
// --- session : jeton + profil, rangés dans le navigateur ---
export function getToken() { return localStorage.getItem("token"); }
export function getVisiteur() { try { return JSON.parse(localStorage.getItem("visiteur")); } catch { return null; } }
export function setSession(token, visiteur) {
    localStorage.setItem("token", token);
    localStorage.setItem("visiteur", JSON.stringify(visiteur));
}

export function logout() { localStorage.clear(); location.href = "/login"; }
// --- appel générique : colle le jeton, centralise les erreurs ---
async function http(path, options = {}) {
    const token = getToken();
    const publicPath = path === "/auth/login" || path === "/auth/register";
    const bodyIsFormData = options.body instanceof FormData;
    const res = await fetch(`${API_URL}${path}`, {
        headers: {
            ...(!bodyIsFormData ? { "Content-Type": "application/json" } : {}),
            ...(token && !publicPath ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
        ...options,
    });
    if (res.status === 401 && !publicPath) {
        logout();
        throw new Error("Session expirée");
    }
    if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Erreur lors de l’appel à l’API");
    }
    if (res.status === 204) return null;
    return res.json();
}

// --- actions métier (chaque fonction = une route de l'API) ---
export const AuthAPI = {
    login: (email, password) => http("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (donnees) => http("/auth/register", {
        method: "POST",
        body: JSON.stringify(donnees),
    }),
};

export const FichesAPI = {
    lister: () => http("/fiches"),
    lire: (id) => http(`/fiches/${id}`),
    creer: (donnees) => http("/fiches", { method: "POST", body: JSON.stringify(donnees) }),
    ajouterLigne: (id, ligne) => http(`/fiches/${id}/lignes`, { method: "POST", body: JSON.stringify(ligne) }),
    cloturer: (id) => http(`/fiches/${id}/cloturer`, { method: "PUT" }),
    valider: (id) => http(`/fiches/${id}/valider`, { method: "PUT" }),
    changerEtat: (id, etat) => http(`/fiches/${id}/etat`, {
        method: "PUT",
        body: JSON.stringify({ etat }),
    }),
    analyser: (image) => {
        const donnees = new FormData();
        donnees.append("justificatif", image);
        return http("/fiches/analyse", { method: "POST", body: donnees });
    },
    supprimer: (id) => http(`/fiches/${id}`, { method: "DELETE" }),
};

export const StatsAPI = {
    lire: (filtres = {}) => {
        const params = new URLSearchParams();
        Object.entries(filtres).forEach(([cle, valeur]) => {
            if (valeur) params.set(cle, valeur);
        });
        const query = params.toString();
        return http(`/stats${query ? `?${query}` : ""}`);
    },
};