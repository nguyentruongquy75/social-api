const express = require("express");
const router = express.Router();
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");
const Message = require("../models/Message");

// get chat room by id
router.get("/:id", async (req, res) => {
  const chatRoomId = req.params.id;
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId).populate({
      path: "participants",
    });
    res.status(200).json(chatRoom);
  } catch (err) {
    res.status(400).json(err);
  }
});

// get all messages of chat room
router.get("/:id/messages", async (req, res) => {
  const chatRoomId = req.params.id;
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId, "messages").populate({
      path: "messages",
      options: { sort: { createAt: -1 }, skip: (page - 1) * limit, limit },
      populate: {
        path: "reaction user",
      },
    });

    res.status(200).json(chatRoom.messages.reverse());
  } catch (err) {
    res.status(400).json(err);
  }
});

// read messages of chat room
router.patch("/:id/messages", async (req, res) => {
  const chatRoomId = req.params.id;
  const userId = req.body.userId;
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId).populate(
      "messages",
      null,
      {
        user: {
          $ne: userId,
        },
        seen: [],
      }
    );

    if (chatRoom.messages.length > 0) {
      chatRoom.messages.forEach((message) => {
        message.seen.push(userId);
        message.save();
      });

      chatRoom.participants.forEach(async (user) => {
        // socket
        global.io.emit(user + "chatrooms", "change");
      });

      // socket
      global.io.emit(chatRoomId + "chat", "change");
    }
    res.status(200).json(chatRoom.messages);
  } catch (error) {
    res.status(400).json(error);
  }
});

// add messages
router.post("/:id/messages", async (req, res) => {
  const chatRoomId = req.params.id;
  try {
    const message = new Message({
      ...req.body,
      chatRoom: chatRoomId,
    });
    await message.save();

    const chatRoom = await ChatRoom.findById(chatRoomId);

    chatRoom.messages.push(message._id);
    chatRoom.lastMessage = message._id;
    chatRoom.isRead = false;
    chatRoom.save();

    // socket
    global.io.emit(chatRoomId + "chat", message);

    chatRoom.participants.forEach(async (user) => {
      // socket
      const participant = await User.findById(user);
      participant.chats.pull(chatRoomId);
      participant.chats.push(chatRoomId);
      participant.save();
      global.io.emit(user + "chatrooms", "change");
    });

    res.status(200).json(message);
  } catch (err) {
    res.status(400).json(err);
  }
});

// get chat room
router.post("/", async (req, res) => {
  try {
    const oldChatRoom = await ChatRoom.findOne({
      type: req.body.type,
      participants: {
        $all: req.body.participants,
      },
    }).populate("participants");
    if (!oldChatRoom) {
      const newChatRoom = new ChatRoom(req.body);
      await newChatRoom.save();
      await newChatRoom.populate("participants");
      if (newChatRoom.lastMessage) {
        newChatRoom.participants.forEach(async (user) => {
          const participant = await User.findById(user);
          participant.chats.push(newChatRoom._id);
          participant.save();

          // socket
          global.io.emit(user + "chatrooms", "change");
        });
      }

      return res.status(200).json(newChatRoom);
    }
    res.status(200).json(oldChatRoom);
  } catch (err) {
    res.status(400).json(err);
  }
});

// search
router.get("/", async (req, res) => {
  const searchValue = req.query.q;
  const userId = req.query.userId;
  const regex = new RegExp(searchValue, "i");
  try {
    const resultOfFriend = await User.find({
      fullName: { $regex: regex },
      friends: {
        $elemMatch: { $eq: userId },
      },
    }).limit(10);

    const resultSuggest = await User.find({
      fullName: { $regex: regex },
      friends: { $ne: userId },
    }).limit(10);

    res.status(200).json(resultOfFriend.concat(resultSuggest));
  } catch (err) {
    res.status(400).json(err);
  }
});

//call voice
router.post("/:id/voice", async (req, res) => {
  const chatRoomId = req.params.id;
  const userId = req.body.user;
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    const user = await User.findById(userId);

    const participants = chatRoom.participants.filter(
      (user) => user + "" !== userId + ""
    );

    participants.forEach((participant) => {
      // socket
      global.io.emit(participant + "callvoiceinvitation", {
        chatRoom,
        user,
      });
    });

    res.status(200).json("success");
  } catch (err) {
    res.status(400).json(err);
  }
});

//call voice
router.post("/:id/video", async (req, res) => {
  const chatRoomId = req.params.id;
  const userId = req.body.user;
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    const user = await User.findById(userId);

    const participants = chatRoom.participants.filter(
      (user) => user + "" !== userId + ""
    );

    participants.forEach((participant) => {
      // socket
      global.io.emit(participant + "callvideoinvitation", {
        chatRoom,
        user,
      });
    });

    res.status(200).json("success");
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
