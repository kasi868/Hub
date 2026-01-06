const express = require("express");
const router = express.Router();
const Fee = require("../models/Fees");
const Student = require("../models/Student");
const { sendFirebaseNotification } = require("../utils/notification");
const moment = require("moment");
const { generateMonthlyFees } = require("../utils/feeGenerator");

// const Notification=require("../models/Notification")
//
// ✅ 1️⃣ Add Fee Record
//



router.post("/generate-month", async (req, res) => {
  try {
    await generateMonthlyFees();
    res.json({ message: "Monthly fees generated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Fee generation failed" });
  }
});


// async function sendFeeDueReminders() {
//   const today = moment().startOf("day");
//   const reminderDate = moment(today).add(3, "days"); // 3 days before due

//   // Fetch pending fees due within the reminder period
//   const fees = await Fee.find({
//     paymentStatus: "Pending",
//     feeDueDate: { $lte: reminderDate.toDate(), $gte: today.toDate() },
//   }).populate("studentId");

//   let sentCount = 0;

//   for (let fee of fees) {
//     const token = fee.studentId?.fcmToken;
//     if (!token) continue; // Skip if no token

//     const title = "Fee Due Reminder 💸";
//     const body = `Hi ${fee.studentId.name}, your fee for ${fee.month} is due soon.`;

//     try {
//       await sendFirebaseNotification(token, title, body);
//       sentCount++;
//     } catch (err) {
//       console.error(
//         `Failed to send notification for student ${fee.studentId.name}:`,
//         err
//       );
//     }
//   }

//   console.log(`🔔 Sent ${sentCount} fee reminders`);
// }



async function sendFeeDueReminders() {
  console.log("🔔 Fee reminder cron running at", new Date());

  const today = moment().startOf("day");

  const fees = await Fee.find({
    paymentStatus: "Pending",
  }).populate("studentId hostelId");

  for (let fee of fees) {
    const dueDate = moment(fee.feeDueDate).startOf("day");
    const diffDays = dueDate.diff(today, "days");

    // ✅ From 3 days before until due date
    if (diffDays >= 0 && diffDays <= 3) {
      const student = fee.studentId;

      if (!student?.fcmToken) {
        console.log("❌ No token for student:", student?.name);
        continue;
      }

      await sendFirebaseNotification(
        student.fcmToken,
        "Fee Due Reminder 💸",
        `Hi ${student.name}, your hostel fee for ${fee.month} is due on ${dueDate.format(
          "DD MMM"
        )}`
      );

      console.log(
        `✅ Reminder sent to ${student.name} (${diffDays} days left)`
      );
    }
  }
}
router.get("/hostel/:hostelId", async (req, res) => {
  try {
    const { hostelId } = req.params;
    const fees = await Fee.find({ hostelId }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (error) {
    console.error("Error fetching hostel fees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});




//
// ✅ 2️⃣ Update Payment Status
//
router.put("/update-status/:id", async (req, res) => {
  try {
    const { paymentStatus, paymentMode } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee record not found" });

    fee.paymentStatus = paymentStatus;
    fee.paymentMode = paymentMode;
    // if (paymentStatus === "Paid") fee.paidDate = new Date();
    //  if (paymentStatus === "Paid") {
    //   fee.paidDate = new Date();

    // }
if (paymentStatus === "Paid") {
  fee.paidDate = new Date();

  // 🔔 Notify Admin
  const admin = await Admin.findOne({ hostelId: fee.hostelId });

  if (admin?.fcmToken) {
    await sendFirebaseNotification(
      admin.fcmToken,
      "Fee Paid ✅",
      `Student ${fee.studentName} has paid ₹${fee.totalAmount} for ${fee.month}`
    );

    console.log("✅ Admin notified for payment");
  } else {
    console.log("❌ Admin token missing");
  }
}
    await fee.save();
    res.json({ message: "Payment updated ✅", fee });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ✅ 3️⃣ Get All Fee Records (Admin View)
//
router.get("/all", async (req, res) => {
  try {
    const fees = await Fee.find().sort({ month: -1 });
    res.json(fees);
  } catch (error) {
    console.error("Error fetching fee records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ✅ 4️⃣ Get Fees by Student
//
router.get("/student/:studentId", async (req, res) => {
  try {
    // Populate room and hostel so frontend can display room/floor/hostel name
    const fees = await Fee.find({ studentId: req.params.studentId })
      .populate({ path: 'roomId', select: 'roomNumber floorNumber' })
      .populate({ path: 'hostelId', select: 'name' })
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (error) {
    console.error("Error fetching student fees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ✅ 5️⃣ Generate Monthly Fee Report
//
router.get("/report/:month", async (req, res) => {
  try {
    const fees = await Fee.find({ month: req.params.month });

    const totalStudents = fees.length;
    const paidCount = fees.filter(f => f.paymentStatus === "Paid").length;
    const pendingCount = totalStudents - paidCount;
    const totalCollected = fees
      .filter(f => f.paymentStatus === "Paid")
      .reduce((sum, f) => sum + f.totalAmount, 0);

    const report = {
      month: req.params.month,
      totalStudents,
      paidCount,
      pendingCount,
      totalCollected,
    };

    res.json({ message: "Monthly report generated ✅", report });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 🔍 Search by Student Name (case-insensitive)
router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Please provide a name to search" });
    }

    // Case-insensitive regex search
    const fees = await Fee.find({
      studentName: { $regex: name, $options: "i" },
    });

    if (fees.length === 0) {
      return res.status(404).json({ message: "No records found" });
    }

    res.json(fees);
  } catch (error) {
    console.error("Error searching fees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports =  { sendFeeDueReminders,router };
