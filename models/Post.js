const mongoose = require("mongoose");

const Comment = require("./Comment");
const Notification = require("./Notification");
const Reaction = require("./Reaction");
const User = require("./User");

const postSchema = new mongoose.Schema({
  title: String,
  image: {
    type: Array,
    default: [],
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  comments: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    default: [],
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
});

postSchema.pre("remove", async function (next) {
  const post = this;

  // remove comments
  post.comments.forEach(async (item) => {
    const deleteComment = await Comment.findById(item);
    deleteComment.remove();
  });

  // remove reactions

  await Reaction.deleteMany({ forPost: post._id });

  // remove notifications

  const user = await User.findById(post.user);

  const notifications = await Notification.find({
    forPost: post._id,
  });

  notifications.forEach((noti) => {
    user.notifications.pull(noti._id);
    noti.remove();
  });

  user.save();

  next();
});

module.exports = mongoose.model("Post", postSchema);
