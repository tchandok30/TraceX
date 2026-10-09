
const express = require("express");
const router = express.Router();

const {
    getAttackChains,
    getAttackChainById
} = require("../controllers/attackChainController");

const protect = require("../middleware/authMiddleware");

router.get("/", protect, getAttackChains);
router.get("/:id", protect, getAttackChainById);

module.exports = router;