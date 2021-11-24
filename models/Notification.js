const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: String,
});

module.exports = mongoose.model("Notification", notificationSchema);
