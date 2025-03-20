const express = require("express");
const Drawing = require("../models/Drawing");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Save drawing
router.post("/save", authMiddleware, async (req, res) => {
    const { imageData } = req.body;
    const drawing = new Drawing({ userId: req.user.userId, imageData });
    await drawing.save();
    res.json({ message: "Drawing saved" });
});

// Get user's drawings
router.get("/", authMiddleware, async (req, res) => {
    const drawings = await Drawing.find({ userId: req.user.userId });
    res.json(drawings);
});

module.exports = router;
