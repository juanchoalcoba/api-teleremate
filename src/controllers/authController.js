const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@teleremate.uy";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(
  process.env.ADMIN_PASSWORD || "admin123",
  10,
);

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña requeridos." });
  }

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ message: "Credenciales inválidas." });
  }

  const isValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  if (!isValid) {
    return res.status(401).json({ message: "Credenciales inválidas." });
  }

  const token = jwt.sign(
    { email, role: "admin" },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "24h" },
  );

  res.json({
    token,
    user: { email, role: "admin" },
    message: "Sesión iniciada correctamente.",
  });
};

module.exports = { login };
