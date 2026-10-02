const express=require("express");
const router=express.Router();



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

router.get("/admin/users", (req, res) => {
    res.json({
        message: "Admin users fetched successfully",
        users: [
            {
                id: 1,
                name: "Admin"
            },
            {
                id: 2,
                name: "Security"
            }
        ]
    });
});


module.exports = router;
