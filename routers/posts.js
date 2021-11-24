const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User");
const Reaction = require("../models/Reaction");
const Comment = require("../models/Comment");

//======================== Post ===============================

// get post
router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const post = await Post.findById(id).populate("user");

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json(error);
  }
});

// add post
router.post("/", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const user = await User.findById(req.body.user);
    await newPost.save();
    user.posts.push(newPost._id);
    await user.save();

    res.status(200).json(newPost);
  } catch (error) {
    res.status(400).json(error);
  }
});

// update post
router.patch("/", async (req, res) => {
  try {
    const updatePost = await Post.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
    });
    await updatePost.save();

    res.status(200).json(updatePost);
  } catch (error) {
    res.status(400).json(error);
  }
});

// delete post
router.delete("/", async (req, res) => {
  try {
    const deletePost = await Post.findByIdAndDelete(req.body._id);
    const user = await User.findById(deletePost.user._id);

    user.posts.pull(deletePost._id);
    await user.save();

    // remove reaction, comments

    res.status(200).json(deletePost);
  } catch (error) {
    res.status(400).json(error);
  }
});

//====================== Reaction ============================

// get all reactions
router.get("/:id/reactions", async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    res.status(200).json(post.reactions);
  } catch (error) {
    res.status(400).json(error);
  }
});

// add reaction

router.post("/:id/reactions", async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    const user = await User.findById(req.body.user);
    const reaction = new Reaction(req.body);

    reaction.user = user._id;
    const savedReaction = await reaction.save();

    post.reactions.push(savedReaction._id);
    await post.save();

    res.status(200).json(savedReaction);
  } catch (error) {
    res.status(200).json(error);
  }
});

// update reaction

router.patch("/:id/reactions", async (req, res) => {
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

router.delete("/:id/reactions", async (req, res) => {
  const postId = req.params.id;
  const reactionId = req.body._id;

  try {
    const deleteReaction = await Reaction.findByIdAndDelete(reactionId);
    const post = await Post.findById(postId);
    post.reactions.pull(reactionId);
    await post.save();

    res.status(200).json(deleteReaction);
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = router;
