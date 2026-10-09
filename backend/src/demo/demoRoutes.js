const express=require("express");
const router=express.Router();
const protect = require("../middleware/authMiddleware");


router.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({
            message:"Email and password are required"
        });
    }if (email === "admin@test.com" && password === "admin123") {
        return res.json({
            message: "Login successful"
        });
    }

    return res.status(401).json({
        message: "Invalid credentials"
    });
});

router.get("/users", (req, res) => {
    res.json({
        message: "Users fetched successfully",
        users: [
            {
                id: 1,
                name: "Tanisha"
            },
            {
                id: 2,
                name: "Rahul"
            }
        ]
    });
});



router.get("/orders", (req, res) => {
    res.json({
        message: "Orders fetched successfully",
        orders: [
            {
                id: 101,
                amount: 500
            },
            {
                id: 102,
                amount: 900
            }
        ]
    });
});

router.get("/files", (req, res) => {
    res.json({
        message: "Files fetched successfully",
        files: [
            "report.pdf",
            "users.csv",
            "transactions.csv"
        ]
    });
});

router.get("/admin/users", protect, (req, res) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Forbidden: Admin access required"
        });
    }

    res.json({
        message: "Users fetched successfully",
        users: [
            { id: 1, name: "Admin" },
            { id: 2, name: "Security" }
        ]
    });
});



router.post("/run-demo", protect, async (req, res) => {
    const baseURL = `http://127.0.0.1:${process.env.PORT || 5000}`;

    const results = {
        failedLogins: 0,
        endpointScans: 0,
        accessAttempts: 0,
        frequencyRequests: 0,
        errors: []
    };

    // Forward the logged-in user's token to protected demo endpoints.
    const headers = {};
    if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
    }

    const sendRequest = async (method, path, body) => {
        try {
            const response = await fetch(`${baseURL}${path}`, {
                method,
                headers: {
                    ...headers,
                    "Content-Type": "application/json"
                },
                body: body ? JSON.stringify(body) : undefined
            });

            return response.status;
        } catch (error) {
            results.errors.push(`${method} ${path}: ${error.message}`);
            return null;
        }
    };

    try {
        // 1. Generate failed login attempts.
        for (let i = 0; i < 6; i++) {
            const status = await sendRequest("POST", "/api/demo/login", {
                email: "demo-attacker@example.com",
                password: `invalid-password-${i}`
            });

            if (status === 401) results.failedLogins++;
        }

        // 2. Generate requests to unique, nonexistent endpoints.
        for (let i = 1; i <= 6; i++) {
            const status = await sendRequest(
                "GET",
                `/api/demo/scan-target-${i}`
            );

            if (status === 404) results.endpointScans++;
        }

        // 3. Attempt access to the protected admin endpoint.
        const accessStatus = await sendRequest(
            "GET",
            "/api/demo/admin/users"
        );

        if (accessStatus === 403) results.accessAttempts++;

        // 4. Generate enough requests to exercise frequency detection.
        for (let i = 0; i < 22; i++) {
            await sendRequest("GET", "/api/demo/users");
            results.frequencyRequests++;
        }

        // Allow the event logger to finish its asynchronous DB writes.
        await new Promise(resolve => setTimeout(resolve, 1200));

        return res.status(200).json({
            message: "Demo traffic generated. Refresh incidents and the attack graph to view detected activity.",
            results,
            note: "Detection depends on the configured rules, event history, and authenticated user's permissions."
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to run demo",
            error: error.message,
            results
        });
    }
});
module.exports = router;
