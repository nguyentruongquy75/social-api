const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["accepted", "rejected", "pending"],
    default: "pending",
  },
  content: String,
});

module.exports = mongoose.model("Invitation", invitationSchema);
