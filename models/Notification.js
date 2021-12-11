const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: String,
  link: String,
  forPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  forComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
  type: {
    type: String,
    enum: ["comment", "tag", "reaction"],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reaction",
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
