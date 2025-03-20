// routes/drawings.js
const express = require("express");
const Drawing = require("../models/Drawing");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Save drawing
router.post("/save", authMiddleware, async (req, res) => {
    try {
        const { imageData } = req.body;
        const drawing = new Drawing({ userId: req.user.userId, imageData });
        await drawing.save();
        res.json({ message: "Drawing saved" });
    } catch (error) {
        res.status(500).json({ error: "Server error while saving drawing" });
    }
});

// Get user's drawings
router.get("/", authMiddleware, async (req, res) => {
    try {
        const drawings = await Drawing.find({ userId: req.user.userId });
        res.json(drawings);
    } catch (error) {
        res.status(500).json({ error: "Server error while fetching drawings" });
    }
});

module.exports = router;
