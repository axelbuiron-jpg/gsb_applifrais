const API_URL = import.meta.env.VITE_API_URL; // ex. http://localhost:3000/api/v1
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
    const res = await fetch(`${API_URL}${path}`, {
        headers: { "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...options,
    });
    if (res.status === 401) { logout(); throw new Error("Session expirée"); }
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error); }
    return res.json();
}

// --- actions métier (chaque fonction = une route de l'API) ---
export const AuthAPI = {
    login: (email, password) => http("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};

export const FichesAPI = {
    lister: () => http("/fiches"),
    lire: (id) => http(`/fiches/${id}`),
    creer: (mois) => http("/fiches", { method: "POST", body: JSON.stringify({ mois }) }),
    ajouterLigne: (id, ligne) => http(`/fiches/${id}/lignes`, { method: "POST", body: JSON.stringify(ligne) }),
    cloturer: (id) => http(`/fiches/${id}/cloturer`, { method: "PUT" }),
    valider: (id) => http(`/fiches/${id}/valider`, { method: "PUT" }),
};