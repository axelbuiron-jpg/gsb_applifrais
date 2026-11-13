const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (!token) {
    return next(new AppError("Authentification requise", 401));
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: payload.sub,
      role: payload.role
    };

    next();
  } catch {
    next(new AppError("Jeton invalide ou expiré", 401));
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new AppError("Accès refusé", 403));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };