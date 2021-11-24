const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Reaction = require("../models/Reaction");
const User = require("../models/User");
// ======================= Comment =======================

// add comment

router.post("/", async (req, res) => {
  const postId = req.body.post;

  try {
    const post = await Post.findById(postId);
    const newComment = new Comment(req.body);

    const savedComment = await newComment.save();

    post.comments.push(savedComment._id);
    await post.save();

    res.status(200).json(savedComment);
  } catch (error) {
    res.status(400).json(error);
  }
});

// update comment

router.patch("/", async (req, res) => {
  const commentId = req.body._id;

  try {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(400).json(error);
  }
});

// delete comment

router.delete("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const commentId = req.body._id;

  try {
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    // remove comment from post
    const post = await Post.findById(deletedComment.post);

    post.comments.pull(deletedComment._id);

    await post.save();

    // remove reply, remove reaction

    await Comment.deleteMany({ replyOf: deletedComment._id });

    await Reaction.deleteMany({ forComment: deletedComment._id });

    res.status(200).json(deletedComment);

    await session.commitTransaction();
  } catch (error) {
    res.status(400).json(error);
    await session.abortTransaction();
  } finally {
    session.endSession();
  }
});

// ========================= Comment Reaction =========================

// get all reactions
router.get("/:commentId/reactions", async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const comment = await Comment.findById(commentId);
    res.status(200).json(comment.reactions);
  } catch (error) {
    res.status(400).json(error);
  }
});

// add reaction

router.post("/:commentId/reactions", async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const comment = await Comment.findById(commentId);
    const user = await User.findById(req.body.user);
    const reaction = new Reaction(req.body);

    reaction.user = user._id;
    reaction.forComment = commentId;
    const savedReaction = await reaction.save();

    comment.reactions.push(savedReaction._id);
    await comment.save();

    res.status(200).json(savedReaction);
  } catch (error) {
    res.status(200).json(error);
  }
});

// update reaction

router.patch("/:commentId/reactions", async (req, res) => {
  const reactionId = req.body._id;

  try {
    const updatedReaction = await Reaction.findByIdAndUpdate(
      reactionId,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedReaction);
  } catch (error) {
    res.status(400).json(error);
  }
});

// delete reaction

router.delete("/:commentId/reactions", async (req, res) => {
  const commentId = req.params.commentId;
  const reactionId = req.body._id;

  try {
    const deleteReaction = await Reaction.findByIdAndDelete(reactionId);
    const comment = await Comment.findById(commentId);
    comment.reactions.pull(reactionId);
    await comment.save();

    res.status(200).json(deleteReaction);
  } catch (error) {
    res.status(400).json(error);
  }
});

// =================== Comment Reply ==============================

// get all reply
router.get("/:commentId/reply", async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const comment = await Comment.findById(commentId);

    res.status(200).json(comment.reply);
  } catch (error) {
    res.status(400).json(error);
  }
});

// add reply

router.post("/:commentId/reply", async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const comment = await Comment.findById(commentId);
    const replyComment = new Comment(req.body);
    replyComment.replyOf = commentId;

    const savedReplyComment = await replyComment.save();

    comment.reply.push(savedReplyComment._id);
    await comment.save();

    res.status(200).json(savedReplyComment);
  } catch (error) {
    res.status(400).json(error);
  }
});

// update reply

router.patch("/:commentId/reply", async (req, res) => {
  const commentId = req.body._id;

  try {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(400).json(error);
  }
});

// delete reply

router.delete("/:commentId/reply", async (req, res) => {
  const commentId = req.params.commentId;
  const replyCommentId = req.body._id;

  try {
    const deletedComment = await Comment.findByIdAndDelete(replyCommentId);
    const comment = await Comment.findById(commentId);

    comment.reply.pull(deletedComment._id);

    await comment.save();

    res.status(200).json(deletedComment);
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = router;
