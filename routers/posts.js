const express = require("express");
const upload = require("../multer");

const router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User");
const Reaction = require("../models/Reaction");
const Notification = require("../models/Notification");

const firebase = require("../firebase");

//======================== Post ===============================

// get post
router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const post = await Post.findById(id).populate("user reactions");

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json(error);
  }
});

// add post
router.post("/", upload.array("image", 12), async (req, res) => {
  try {
    // strorage image to firebase

    const image = await Promise.all(
      req.files.map((file) => {
        const imageUrl = firebase.uploadFile(file);
        return imageUrl;
      })
    );

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
router.patch("/", upload.array("image", 12), async (req, res) => {
  try {
    const image = await Promise.all(
      req.files.map((file) => {
        const imageUrl = firebase.uploadFile(file);
        return imageUrl;
      })
    );
    const updatePost = await Post.findByIdAndUpdate(
      req.body._id,
      {
        ...req.body,
        image: image.concat(req.body.image),
      },
      {
        new: true,
      }
    );

    res.status(200).json(updatePost);

    console.log(req.body.image);
  } catch (error) {
    res.status(400).json(error);
  }
});

// delete post
router.delete("/", async (req, res) => {
  try {
    const deletePost = await Post.findById(req.body._id);
    const user = await User.findById(deletePost.user._id);

    await deletePost.remove();
    user.posts.pull(deletePost._id);
    user.newsfeed.pull(deletePost._id);

    await user.save();

    // socket
    global.io.sockets.emit(user._id + "notification", "Change");

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
    const post = await Post.findById(postId).populate({
      path: "reactions",
      populate: {
        path: "user",
      },
    });
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
    const reactionUser = await User.findById(req.body.user);
    const reaction = new Reaction(req.body);

    reaction.user = reactionUser._id;
    reaction.forPost = post._id;
    const savedReaction = await reaction.save();

    post.reactions.push(savedReaction._id);
    post.save();
    // ok

    // Notification
    const oldNotification = await Notification.findOne({
      type: "reaction",
      forPost: savedReaction.forPost,
    });

    const postUser = await User.findById(post.user);

    // Check yourself

    if (postUser._id + "" !== reactionUser._id + "") {
      if (oldNotification) {
        const postReactions = await Reaction.find({ forPost: post._id });

        const reactionUsers = new Set(
          postReactions.map((reaction) => reaction.user + "")
        );

        // filter comment yourself

        reactionUsers.has(postUser._id + "") &&
          reactionUsers.delete(postUser._id + "");

        const others =
          reactionUsers.size > 1
            ? `và ${reactionUsers.size - 1} người khác`
            : "";

        // update notification
        oldNotification.title = `${reactionUser.firstName} ${reactionUser.lastName} ${others} đã bày tỏ cảm xúc về bài viết của bạn`;
        oldNotification.isRead = false;
        oldNotification.user = reactionUser._id;
        oldNotification.reaction = savedReaction._id;

        oldNotification.save();

        await oldNotification.populate("user reaction");

        // update notification arr

        postUser.notifications.pull(oldNotification._id);
        postUser.notifications.push(oldNotification._id);
        postUser.save();

        global.io.emit(postUser._id + "notification", oldNotification);
      } else {
        const notification = new Notification({
          type: "reaction",
          forPost: savedReaction.forPost,
          title: `${reactionUser.firstName} ${reactionUser.lastName} đã ${savedReaction.type} bài viết của bạn`,
          user: reactionUser._id,
          reaction: savedReaction._id,
          postId,
        });

        const savedNotification = await notification.save();
        await savedNotification.populate("user reaction");
        postUser.notifications.push(savedNotification._id);
        postUser.save();
        global.io.emit(postUser._id + "notification", savedNotification);
      }
    }

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
    const deleteReaction = await Reaction.findById(reactionId);
    await deleteReaction.remove();
    const post = await Post.findById(postId).populate({
      path: "reactions",
      populate: {
        path: "user",
      },
    });
    post.reactions.pull(reactionId);
    await post.save();

    // update notification
    const oldNotification = await Notification.findOne({
      type: "reaction",
      forPost: deleteReaction.forPost,
    });

    if (oldNotification) {
      const uniqueUserReaction = [
        ...new Set(
          post.reactions
            .filter((reaction) => reaction.user._id + "" !== post.user + "")
            .map((reaction) => reaction.user._id)
        ),
      ];
      const latestReaction =
        post.reactions[post.reactions.length - 1].user._id + "" !==
        post.user + ""
          ? post.reactions[post.reactions.length - 1]
          : post.reactions[post.reactions.length - 2];
      const others =
        uniqueUserReaction.length > 1
          ? `và ${uniqueUserReaction.length - 1} người khác`
          : "";
      if (uniqueUserReaction.length === 1) {
        oldNotification.title = `${latestReaction.user.fullName} đã ${latestReaction.type} bài viết của bạn`;
      } else {
        oldNotification.title = `${latestReaction.user.fullName} ${others} đã bày tỏ cảm xúc về bài viết của bạn`;
      }

      await oldNotification.save();
    }

    // socket
    global.io.sockets.emit(post.user + "notification", oldNotification);

    res.status(200).json(deleteReaction);
  } catch (error) {
    res.status(400).json(error);
  }
});

// ============== Comment =============================

router.get("/:id/comments", async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId).populate({
      path: "comments",
      populate: {
        path: "user reactions",
      },
    });
    res.status(200).json(post.comments);
  } catch (error) {
    res.status(400).json(error);
  }
});
module.exports = router;
