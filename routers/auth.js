const express = require("express");
const Account = require("../models/Account");
const router = express.Router();

router.post("/login", async (req, res) => {
  const account = await Account.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (!account)
    res.status(404).json({
      message: "Invalid username or password",
    });

  res.status(200).json(account);
});

router.post("/register", async (req, res) => {
  const newAccount = new Account(req.body);

  newAccount.save((error) => {
    if (error) {
      return res.status(400).json(error);
    }

    return res.status(200).json({
      id: newAccount._id,
    });
  });
});

module.exports = router;
