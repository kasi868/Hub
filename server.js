const dotenv = require('dotenv');
dotenv.config(); // This loads the environment variables from .env file

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');

const authRoutes = require("./routes/authRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const adminRoutes = require("./routes/adminRoutes");
const roomRoutes = require("./routes/roomRoutes");
const studentRoutes = require("./routes/studentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { router: feeRoutes, sendFeeDueReminders } = require("./routes/feeRoutes");
const receiptRoutes=require("./routes/receipt")
const hostelRoutes = require("./routes/hostelRoutes");

const ownerRoutes=require("./routes/ownerRoutes");
const expensesRoute=require("./routes/expenseRoutes");

const { generateMonthlyFees } = require("./utils/feeGenerator");
const notificationRoutes=require("./routes/notificationsRoutes")
// Connect to MongoDB
connectDB();

const app = express();

const cron = require("node-cron");
// const axios = require("axios");

// ⏰ Daily at 1 AM – Generate Fees
cron.schedule("0 1 * * *", async () => {
  console.log("📅 Running fee generation cron");
  await generateMonthlyFees();
});

// cron.schedule("0 8 * * *", async () => {
//   console.log("🔔 Running fee reminder cron");
//   await sendFeeDueReminders();
// });

cron.schedule("30 16 * * *", async () => {
  console.log("🔔 Running fee reminder cron");
  await sendFeeDueReminders();
});


// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/owner",ownerRoutes);
app.use("/api/expenses",expensesRoute);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/receipt",receiptRoutes);


// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.post("/api/test-fee-reminder", async (req, res) => {
  await sendFeeDueReminders();
  res.send("Fee reminder triggered manually");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Listen using the HTTP server instead of app
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
