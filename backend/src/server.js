const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const eventLogger = require("./middleware/eventLogger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const demoRoutes = require("./demo/demoRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// IMPORTANT
app.use(eventLogger);

app.get("/api/health", (req, res) => {
    res.json({
        status: "TraceX API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/demo", demoRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});