// routes/notificationsRoutes.js
const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const admin = require("../config/firebase");

// router.post("/register-token", async (req, res) => {
//   try {
//     const { userId, role, token } = req.body;

//     if (!userId || !role || !token) return res.status(400).json({ message: "Missing fields" });

//     let user;
//     if (role === "student") user = await Student.findById(userId);
//     else if (role === "admin") user = await Admin.findById(userId);

//     if (!user) return res.status(404).json({ message: "User not found" });

//     user.fcmToken = token;
//     await user.save();

//     res.json({ message: "Token registered successfully ✅" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


router.post("/register-token", async (req, res) => {
  try {
    const { userId, role, token } = req.body;

    if (!userId || !role || !token) {
      return res.status(400).json({ message: "Missing fields" });
    }

    let user;

    // 🔐 STEP 1: Remove this token from ALL other users (students + admins)
    await Student.updateMany(
      { fcmToken: token, _id: { $ne: userId } },
      { $unset: { fcmToken: "" } }
    );

    await Admin.updateMany(
      { fcmToken: token, _id: { $ne: userId } },
      { $unset: { fcmToken: "" } }
    );

    // 🔍 STEP 2: Assign token to correct user
    if (role === "student") {
      user = await Student.findById(userId);
    } else if (role === "admin") {
      user = await Admin.findById(userId);
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    user.fcmToken = token;
    await user.save();

    res.json({ message: "Token registered successfully ✅" });
  } catch (err) {
    console.error("Register token error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/test-notification", async (req, res) => {
  const { token } = req.body;

  const message = {
    token,
    notification: {
      title: "🔥 Test Notification",
      body: "Option A test successful",
    },
  };

  try {
    await admin.messaging().send(message);
    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/remove-token", async (req, res) => {
  const { userId, role } = req.body;

  let user;
  if (role === "student") user = await Student.findById(userId);
  else if (role === "admin") user = await Admin.findById(userId);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.fcmToken = null;
  await user.save();

  res.json({ message: "Token removed successfully" });
});
module.exports = router;