const mongoose = require("mongoose");

const Comment = require("./Comment");
const Reaction = require("./Reaction");

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

  next();
});

module.exports = mongoose.model("Post", postSchema);
