const mongoose = require("mongoose");

const Notification = require("./Notification");

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
    });
  } else if (reaction.forComment) {
    notification = await Notification.findOne({
      forComment: reaction.forComment,
      type: "reaction",
    });
  }

  if (!notification.title.includes("và")) {
    await notification.remove();
  }
});

module.exports = mongoose.model("Reaction", reactionSchema);
