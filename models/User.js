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
  cover: String,
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
  newsfeed: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  friendInvitations: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invitation",
      },
    ],
  },
  fullName: String,
  address: String,
  status: {
    type: String,
    enum: [
      "Single",
      "In Relationship",
      "Engaged",
      "Married",
      "Registered cohabitation",
      "Cohabitation",
      "Find out",
    ],
  },
});

userSchema.pre("save", async function (next) {
  const user = this;
  const newsfeedLength = user.newsfeed.length;

  if (newsfeedLength >= 20) {
    const lastNewsFeedId = user.newsfeed[newsfeedLength - 1];
    user.newsfeed.pull(lastNewsFeedId);
    user.save();
  }

  next();
});

module.exports = mongoose.model("User", userSchema);
