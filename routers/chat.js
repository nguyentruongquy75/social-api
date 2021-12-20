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
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId).populate({
      path: "messages",
      populate: {
        path: "reaction user",
      },
    });
    res.status(200).json(chatRoom.messages);
  } catch (err) {
    res.status(400).json(err);
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
    chatRoom.save();

    // socket
    global.io.emit(chatRoomId + "chat", "change");

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

// add chat room
router.post("/", async (req, res) => {
  try {
    const newChatRoom = new ChatRoom(req.body);
    await newChatRoom.save();
    newChatRoom.participants.forEach(async (user) => {
      const participant = await User.findById(user);
      participant.chats.push(newChatRoom._id);
      participant.save();

      // socket
      global.io.emit(user + "chatrooms", "change");
    });

    res.status(200).json(newChatRoom);
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
