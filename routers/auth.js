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

  try {
  const savedAccount = await newAccount.save();
  res.status(200).json({
    id: savedAccount._id
  })
  } catch(error) {
    res.status(400).json(error)
  }
  
  
});

module.exports = router;
