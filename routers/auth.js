const express = require("express");
const Account = require("../models/Account");
const User = require("../models/User");
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const account = await Account.findOne({
      username: req.body.username,
      password: req.body.password,
    });

    if (!account)
      res.status(404).json({
        message: "Invalid username or password",
      });
    else res.status(200).json(account);
  } catch (error) {
    console.log(error);
  }
});

router.post("/register", async (req, res) => {
  const newAccount = new Account({
    username: req.body.username,
    password: req.body.password,
  });

  try {
    await newAccount.save();
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      birthday: req.body.birthday,
      account: newAccount._id,
    });

    await user.save();
    res.status(200).json({
      id: user._id,
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
