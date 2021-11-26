const mongoose = require("mongoose");

const Reaction = require("./Reaction");

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

// Middleware
commentSchema.pre("remove", function (next) {
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

  next();
});

module.exports = mongoose.model("Comment", commentSchema);
