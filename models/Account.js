const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    ref: "User",
  },
});

module.exports = mongoose.model("Account", accountSchema);
