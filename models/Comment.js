const mongoose = require("mongoose");

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
});

module.exports = mongoose.model("Comment", commentSchema);
