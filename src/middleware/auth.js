const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT and attach user to request
 */
const protect = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado. Token requerido." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
};

/**
 * Middleware to restrict access based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.warn(
        `[SECURITY ALERT] Intento de acceso denegado para: ${req.user?.email || "Anónimo"} - Rol requerido: ${roles}`,
      );
      return res.status(403).json({
        message: "No tienes permisos para realizar esta acción.",
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
