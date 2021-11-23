const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  birthday: {
    type: Date,
    default: Date.now,
  },
  province: String,
  avatar: String,
  bio: String,
  posts: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    default: [],
  },
  friends: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  notifications: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],
    default: [],
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: "Account",
  },
});

module.exports = mongoose.model("User", userSchema);
