const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoute = require("./routers/auth");
const userRoute = require("./routers/user");
const postRoute = require("./routers/posts");
const commentRoute = require("./routers/comments");
const chatRoute = require("./routers/chat");
const db = mongoose.connection;

// socketio

const { Server } = require("socket.io");
const server = app.listen(process.env.PORT || 5000);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

global.io = io;

dotenv.config();
app.use(bodyParser.json());

io.on("connection", (socket) => {
  socket.on("callvoicejoin", (data) => {
    io.emit(data.chatRoom._id + "callvoicejoin", data.user);
  });

  socket.on("callvoicedisconnect", (data) => {
    io.emit(data.chatRoom._id + "callvoicedisconnect", data.user);
  });
});

//connect db
mongoose
  .connect(process.env.MONGO, { useNewUrlParser: true })
  .then(() => console.log("DB Connected!"));
db.on("error", (err) => {
  console.log("DB connection error:", err.message);
});

app.use(cors());
app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/posts", postRoute);
app.use("/comments", commentRoute);
app.use("/chat", chatRoute);
app.use("/uploads", express.static("uploads"));

module.exports = app;
