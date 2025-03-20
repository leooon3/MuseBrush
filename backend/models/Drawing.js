const mongoose = require("mongoose");

const DrawingSchema = new mongoose.Schema({
  userId: String,
  imageData: String, // Save drawing as base64 string
});

module.exports = mongoose.model("Drawing", DrawingSchema);
