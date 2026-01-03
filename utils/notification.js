const admin = require("../config/firebase");

async function sendFirebaseNotification(token, title, body) {
  const message = {
    token,
    notification: {
      title,
      body,
    },
    android: {
      priority: "high",
    },
  };

  await admin.messaging().send(message);
}

module.exports = { sendFirebaseNotification };
