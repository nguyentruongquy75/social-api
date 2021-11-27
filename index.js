const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const authRoute = require("./routers/auth");
const userRoute = require("./routers/user");
const postRoute = require("./routers/posts");
const commentRoute = require("./routers/comments");
const db = mongoose.connection;

// socketio

const { Server } = require("socket.io");
const server = app.listen(process.env.PORT || 3000);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", function (socket) {
  console.log(socket.id);
});

dotenv.config();
app.use(bodyParser.json());

//connect db
mongoose
  .connect(process.env.MONGO, { useNewUrlParser: true })
  .then(() => console.log("DB Connected!"));
db.on("error", (err) => {
  console.log("DB connection error:", err.message);
});

app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/posts", postRoute);
app.use("/comments", commentRoute);
app.use("/uploads", express.static("uploads"));

module.exports = app;
