const express = require("express");
const cors = require("cors");

const testRoutes = require("./routes/testRoutes");
const charityRoutes = require("./routes/charityRoutes");
const authRoutes = require("./routes/authRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const drawRoutes = require("./routes/drawRoutes");
const drawEntryRoutes = require("./routes/drawEntryRoutes");
const winnerRoutes = require("./routes/winnerRoutes");

const app = express();

// =========================================
// CORS
// =========================================

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin
      // such as Postman/server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },
    credentials: true,
  })
);

// =========================================
// BODY PARSER
// =========================================

app.use(express.json());

// =========================================
// ROUTES
// =========================================

app.use("/api/test", testRoutes);

app.use("/api/charities", charityRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/scores", scoreRoutes);

app.use("/api/subscriptions", subscriptionRoutes);

app.use("/api/draws", drawRoutes);

app.use("/api/draw-entries", drawEntryRoutes);

app.use("/api/winners", winnerRoutes);

// =========================================
// HOME ROUTE
// =========================================

app.get("/", (req, res) => {
  res.json({
    message: "Digital Heroes API is running 🚀",
  });
});

module.exports = app;