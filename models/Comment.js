const mongoose = require("mongoose");

const Reaction = require("./Reaction");
const Notification = require("./Notification");
const User = require("./User");

const commentSchema = mongoose.Schema({
  message: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  tags: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  reply: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    default: [],
  },
  reactions: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reaction",
      },
    ],
    default: [],
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    require: true,
  },
  replyOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
  createAt: {
    type: String,
    default: Date.now,
  },
});

// Middleware
commentSchema.pre("remove", async function (next) {
  const comment = this;

  // remove reply
  comment.reply.forEach(async (item) => {
    const deleteReply = await comment.model("Comment").findById(item);
    deleteReply.remove();
  });

  // remove reaction

  comment.reactions.forEach(async (item) => {
    await Reaction.findByIdAndDelete(item);
  });

  // remove notification

  const notifications = await Notification.find({
    forComment: comment._id,
  });
  const user = await User.findById(comment.user);
  notifications.forEach((noti) => {
    user.notifications.pull(noti._id);
    noti.remove();
  });
  user.save();
  next();
});

module.exports = mongoose.model("Comment", commentSchema);
