const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: String,
  link: String,
});

module.exports = mongoose.model("Notification", notificationSchema);
