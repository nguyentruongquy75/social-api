const mongoose = require("mongoose");

const Notification = require("./Notification");
const User = require("./User");

const reactionSchema = mongoose.Schema({
  type: {
    type: "String",
    enum: ["Like", "Haha", "Love", "Sad", "Wow", "Angry"],
    require: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  forPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  forComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
});

// Middleware
reactionSchema.pre("remove", async function (next) {
  const reaction = this;

  let notification;
  if (reaction.forPost) {
    notification = await Notification.findOne({
      forPost: reaction.forPost,
      type: "reaction",
    }).populate("forPost");
  } else if (reaction.forComment) {
    notification = await Notification.findOne({
      forComment: reaction.forComment,
      type: "reaction",
    }).populate("forComment");
  }

  if (notification && !notification.title.includes("và")) {
    if (notification.forPost) {
      const user = await User.findById(notification.forPost.user);
      user.notifications.pull(notification._id);
      user.save();
    } else {
      const user = await User.findById(notification.forComment.user);
      user.notifications.pull(notification._id);
      user.save();
    }
    await notification.remove();
  }
});

module.exports = mongoose.model("Reaction", reactionSchema);
