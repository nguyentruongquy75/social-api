const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Reaction = require("../models/Reaction");
const User = require("../models/User");
const Notification = require("../models/Notification");
// ======================= Comment =======================

// add comment

router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const postId = req.body.post;

  try {
    const post = await Post.findById(postId);
    const newComment = new Comment(req.body);
    const savedComment = await newComment.save();

    const commentUser = await User.findById(savedComment.user);
    const postUser = await User.findById(post.user);

    // push comment to post comment arr
    post.comments.push(savedComment._id);
    post.save();

    // Notification

    const oldNotification = await Notification.findOne({
      type: "comment",
      forPost: savedComment.post,
    });

    if (postUser._id + "" !== commentUser._id + "") {
      if (oldNotification) {
        const postComments = await Comment.find({ post: post._id });

        const commentUsers = new Set(
          postComments.map((comment) => comment.user + "")
        );

        // filter comment yourself

        commentUsers.has(postUser._id + "") &&
          commentUsers.delete(postUser._id + "");

        const others =
          commentUsers.size > 1 ? `và ${commentUsers.size - 1} người khác` : "";

        // update notification
        oldNotification.title = `${commentUser.firstName} ${commentUser.lastName} ${others} đã bình luận bình viết của bạn`;
        oldNotification.isRead = false;

        oldNotification.save();

        // update notification arr

        postUser.notifications.pull(oldNotification._id);
        postUser.notifications.push(oldNotification._id);
        postUser.save();
      } else {
        console.log("new");
        const notification = new Notification({
          type: "comment",
          forPost: savedComment.post,
          title: `${commentUser.firstName} ${commentUser.lastName} đã bình luận bình viết của bạn`,
        });

        const savedNotification = await notification.save();
        postUser.notifications.push(savedNotification._id);
        postUser.save();
      }
    }

    res.status(200).json(savedComment);
    session.commitTransaction();
  } catch (error) {
    res.status(400).json(error);
    session.abortTransaction();
  } finally {
    session.endSession();
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
    const deletedComment = await Comment.findById(commentId);
    deletedComment.remove();

    // remove comment from post
    const post = await Post.findById(deletedComment.post);

    post.comments.pull(deletedComment._id);

    post.save();

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
    const reactionUser = await User.findById(req.body.user);
    const reaction = new Reaction(req.body);

    reaction.user = reactionUser._id;
    reaction.forComment = commentId;
    const savedReaction = await reaction.save();

    comment.reactions.push(savedReaction._id);
    comment.save();

    // Notification

    const oldNotification = await Notification.findOne({
      type: "reaction",
      forComment: savedReaction.forComment,
    });

    const commentUser = await User.findById(comment.user);

    // Check yourself

    if (commentUser._id + "" !== reactionUser._id + "") {
      if (oldNotification) {
        const commentReactions = await Reaction.find({
          forComment: comment._id,
        });

        const reactionUsers = new Set(
          commentReactions.map((reaction) => reaction.user + "")
        );

        // filter comment yourself

        reactionUsers.has(commentUser._id + "") &&
          reactionUsers.delete(commentUser._id + "");

        const others =
          reactionUsers.size > 1
            ? `và ${reactionUsers.size - 1} người khác`
            : "";

        // update notification
        oldNotification.title = `${commentUser.firstName} ${commentUser.lastName} ${others} đã bày tỏ cảm xúc về bình luận của bạn`;
        oldNotification.isRead = false;

        oldNotification.save();

        // update notification arr

        commentUser.notifications.pull(oldNotification._id);
        commentUser.notifications.push(oldNotification._id);
        commentUser.save();
      } else {
        console.log("new");
        const notification = new Notification({
          type: "reaction",
          forComment: savedReaction.forComment,
          title: `${reactionUser.firstName} ${reactionUser.lastName} đã ${savedReaction.type} bình luận của bạn`,
        });

        const savedNotification = await notification.save();
        commentUser.notifications.push(savedNotification._id);
        commentUser.save();
      }
    }

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
    replyComment.post = comment.post;

    const savedReplyComment = await replyComment.save();

    comment.reply.push(savedReplyComment._id);
    comment.save();

    // Notification
    const oldNotification = await Notification.findOne({
      type: "comment",
      forComment: savedReplyComment.replyOf,
    });

    const commentUser = await User.findById(comment.user);
    const replyUser = await User.findById(savedReplyComment.user);

    // Check yourself

    if (commentUser._id + "" !== replyUser._id + "") {
      if (oldNotification) {
        const commentReplies = await Comment.find({
          replyOf: savedReplyComment.replyOf,
        });

        const replyUsers = new Set(
          commentReplies.map((reply) => reply.user + "")
        );

        // filter comment yourself

        replyUsers.has(commentUser._id + "") &&
          replyUsers.delete(commentUser._id + "");

        const others =
          replyUsers.size > 1 ? `và ${replyUsers.size - 1} người khác` : "";

        // update notification
        oldNotification.title = `${replyUser.firstName} ${replyUser.lastName} ${others} đã trả lời bình luận của bạn của bạn`;
        oldNotification.isRead = false;

        oldNotification.save();

        // update notification arr

        commentUser.notifications.pull(oldNotification._id);
        commentUser.notifications.push(oldNotification._id);
        commentUser.save();
      } else {
        console.log("new");
        const notification = new Notification({
          type: "comment",
          forComment: savedReplyComment.replyOf,
          title: `${replyUser.firstName} ${replyUser.lastName} đã trả lời bình luận của bạn`,
        });

        const savedNotification = await notification.save();
        commentUser.notifications.push(savedNotification._id);
        commentUser.save();
      }
    }

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
