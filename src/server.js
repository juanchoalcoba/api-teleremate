require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const reservationsRoutes = require("./routes/reservations");
const purchasesRoutes = require("./routes/purchases");
const submissionsRoutes = require("./routes/submissions");
const adminSubmissionsRoutes = require("./routes/adminSubmissions");

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://teleremate-front.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// No longer serving local static files since images go to Cloudinary
// (app.use("/uploads"...) removed)

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
connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
      console.log(`   Health: /api/health`);
    });
  })
  .catch((err) => {
    console.error("❌ Fallo crítico al iniciar el servidor:", err.message);
    process.exit(1);
  });

module.exports = app;
