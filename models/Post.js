const mongoose = require("mongoose");

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
});

module.exports = mongoose.model("Post", postSchema);
