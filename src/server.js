const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const demoroutes=require("./demo/demoRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const eventLogger = require("./middleware/eventLogger");
dotenv.config();

const app = express();

app.use(express.json());
app.use(eventLogger);



const PORT = process.env.PORT || 5000;

connectDB();
app.use("/api/users", userRoutes);
app.use("/api",authRoutes);
app.use("/api/demo", demoroutes);
app.use("/api/incidents", incidentRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        status: "TraceX API is running"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});