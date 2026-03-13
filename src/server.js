require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const reservationsRoutes = require("./routes/reservations");
const purchasesRoutes = require("./routes/purchases");
const submissionsRoutes = require("./routes/submissions");
const adminSubmissionsRoutes = require("./routes/adminSubmissions");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/teleremate";

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    message:
      "Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin access logger
const adminLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[ADMIN ACCESS] ${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip} - User: ${req.user?._id || "Invitado"}`,
  );
  next();
};

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/articles", publicRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/backoffice/submissions", adminLogger, adminSubmissionsRoutes);
app.use("/api/backoffice", adminLogger, adminRoutes);
app.use("/api/auth/login", loginLimiter, authRoutes);
app.use("/api/auth", authRoutes); // Keep standard auth routes for other needs if any

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB:", MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Articles: http://localhost:${PORT}/api/articles`);
    });
  })
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err.message);
    process.exit(1);
  });

module.exports = app;
