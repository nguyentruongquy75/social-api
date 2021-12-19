const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["single", "group"],
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  isRead: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
});

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
