// var admin = require("firebase-admin");

// var serviceAccount = require("../serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });



const admin = require("firebase-admin");

// Load environment variables
require('dotenv').config();

// Parse Firebase service account from env variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase initialized successfully");

module.exports = admin;