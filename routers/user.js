const express = require("express");
const User = require("../models/User");
const Account = require("../models/Account");
const Post = require("../models/Post");
const Invitation = require("../models/Invitation");
const Notification = require("../models/Notification");
const router = express.Router();

const upload = require("../multer");

// get all user
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json(error);
  }
});

// get by id
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id).populate({
      path: " friends",
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({
      message: "Invalid user",
    });
  }
});

// add user
router.post("/", upload.single("avatar"), (req, res) => {
  const baseUrl = `${req.protocol}://${req.headers.host}`;
  const avatar = `${baseUrl}/uploads/${req.file.filename}`;
  const newUser = new User({
    ...req.body,
    avatar,
  });

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

// get all friendInvitations

router.get("/:id/invite", async function (req, res) {
  const id = req.params.id;

  try {
    const user = await User.findById(id).populate({
      path: "friendInvitations",
      populate: {
        path: "sender",
      },
    });

    res.status(200).json(user.friendInvitations);
  } catch (err) {
    res.status(400).json(err);
  }
});

// send invitation

router.post("/:id/invite", async function (req, res) {
  const userId = req.params.id;

  try {
    const invitation = new Invitation(req.body);
    const savedInvitation = await invitation.save();

    const user = await User.findById(userId);

    user.friendInvitations.push(savedInvitation._id);

    await user.save();
    res.status(200).json(invitation);
  } catch (err) {
    res.status(400).json(err);
  }
});

// update invitation

router.patch("/:id/invite", async function (req, res) {
  const userId = req.params.id;

  try {
    const updateInvitation = await Invitation.findByIdAndUpdate(
      req.body._id,
      req.body,
      {
        new: true,
      }
    );
    const receiver = await User.findById(userId);

    if (updateInvitation.status === "accepted") {
      // add friends
      const sender = await User.findById(updateInvitation.sender);
      receiver.friends.push(sender._id);
      sender.friends.push(receiver._id);
      sender.save();
    }
    // pull invitation
    receiver.friendInvitations.pull(updateInvitation._id);
    receiver.save();

    updateInvitation.remove();
    res.status(200).json("Success");
  } catch (err) {
    res.status(400).json(err);
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

// ======================== Newsfeed ============================

router.get("/:id/newsfeed", async function (req, res) {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).populate({
      path: "newsfeed",
      options: { sort: { publishedAt: -1 } },
      populate: {
        path: "user reactions",
      },
    });
    res.status(200).json(user.newsfeed);
  } catch (error) {
    res.status(400).json(error);
  }
});

// ===================== Notifications =====================

// get all
router.get("/:id/notifications", async function (req, res) {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).populate("notifications");

    res.status(200).json(user.notifications);
  } catch (error) {
    res.status(400).json(error);
  }
});

// update isRead

router.patch("/:id/notifications", async function (req, res) {
  try {
    const notificationArr = req.body.notifications;

    notificationArr.forEach(async (notiId) => {
      await Notification.findByIdAndUpdate(notiId, {
        isRead: true,
      });
    });

    res.status(200).json("Change isRead success");
  } catch (error) {
    res.status(400).json(error);
  }
});

// =============== Posts ===============

router.get("/:id/posts", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).populate({
      path: "posts",
      options: { sort: { publishedAt: -1 } },
      populate: {
        path: "user reactions",
      },
    });
    res.status(200).json(user.posts);
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = router;
