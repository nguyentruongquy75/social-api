const mongoose = require("mongoose");

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

module.exports = mongoose.model("Reaction", reactionSchema);
