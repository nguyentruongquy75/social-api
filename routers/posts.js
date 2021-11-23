const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User");

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const post = await Post.findById(id).populate("user");

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json(error);
  }
});

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

router.delete("/", async (req, res) => {
  try {
    const deletePost = await Post.findByIdAndDelete(req.body._id);

    res.status(200).json(deletePost);
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = router;
