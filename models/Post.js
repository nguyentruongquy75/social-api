const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  image: {
    type: Array,
    default: [],
  },
  tags: {
    type: Array,
    default: [],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Post", postSchema);
