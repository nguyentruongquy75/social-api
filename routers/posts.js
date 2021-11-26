const express = require("express");
const upload = require("../multer");

const router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User");
const Reaction = require("../models/Reaction");

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
router.post("/", upload.array("image", 12), async (req, res) => {
  try {
    // add post to posts
    const baseUrl = `${req.protocol}://${req.headers.host}`;

    const image = req.files.map((file) => {
      return `${baseUrl}/uploads/${file.filename}`;
    });

    const newPost = new Post({
      ...req.body,
      image,
    });
    const user = await User.findById(req.body.user);
    await newPost.save();
    user.posts.push(newPost._id);

    // add post to newsfeed
    user.newsfeed.push(newPost._id);

    // add post to friend newsfeed
    user.friends.forEach(async (userId) => {
      const friend = await User.findById(userId);
      friend.newsfeed.push(newPost._id);
      friend.save();
    });

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

    res.status(200).json(updatePost);
  } catch (error) {
    res.status(400).json(error);
  }
});

// delete post
router.delete("/", async (req, res) => {
  try {
    const deletePost = await Post.findById(req.body._id);
    const user = await User.findById(deletePost.user._id);

    deletePost.remove();
    user.posts.pull(deletePost._id);
    await user.save();

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
    reaction.forPost = post._id;
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
