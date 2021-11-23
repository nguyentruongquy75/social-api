const express = require("express");
const User = require("../models/User");
const Account = require("../models/Account");
const Post = require("../models/Post");
const router = express.Router();

// get all user
router.get("/", async (req, res) => {
  try {
    const users = await User.find().populate("account");
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json(error);
  }
});

// get by id
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({
      message: "Invalid user",
    });
  }
});

// add user
router.post("/", (req, res) => {
  const newUser = new User(req.body.user);

  newUser.save(async (error) => {
    if (error) {
      return res.status(400).json(error);
    }

    // Update account
    await Account.updateOne({ _id: newUser.account }, { user: newUser._id });

    return res.status(200).json(newUser);
  });
});

// update user
router.patch("/", async (req, res) => {
  try {
    const updateUser = await User.findByIdAndUpdate(req.body._id, req.body);
    res.status(200).json(updateUser);
  } catch (error) {
    res.status(400).json(error);
  }
});

// delete
router.delete("/", async (req, res) => {
  try {
    const deleteUser = await User.findByIdAndRemove(req.body._id);
    res.status(200).json(deleteUser);
  } catch (error) {
    res.status(400).json(error);
  }
});

// get all friends
router.get("/:id/friends", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id).populate("friends");
    res.status(200).json(user.friends);
  } catch (error) {
    res.status(404).json({
      message: "Invalid user",
    });
  }
});

// add friends
router.post("/:id/friends", async (req, res) => {
  const id = req.params.id;
  try {
    const user1 = await User.findById(id);
    const user2 = await User.findById(req.body._id);

    user1.friends.push(user2._id);
    user2.friends.push(user1._id);

    user1.save();
    user2.save();

    res.status(200).json(user1.friends);
  } catch (error) {
    res.status(404).json(error);
  }
});

// delete friends
router.delete("/:id/friends", async (req, res) => {
  const id = req.params.id;
  try {
    const user1 = await User.findById(id);
    const user2 = await User.findById(req.body._id);

    user1.friends.pull(user2._id);
    user2.friends.pull(user1._id);

    user1.save();
    user2.save();

    res.status(200).json(user1.friends);
  } catch (error) {
    res.status(404).json(error);
  }
});

module.exports = router;
