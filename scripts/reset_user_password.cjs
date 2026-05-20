// scripts/reset_user_password.cjs
const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2];
const newPassword = process.argv[3];

if (!uid || !newPassword) {
  console.error("Usage:");
  console.error("node scripts/reset_user_password.cjs USER_UID NewPassword123!");
  process.exit(1);
}

async function resetPassword() {
  try {
    const userRecord = await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    console.log("✅ Password updated successfully.");
    console.log(`User: ${userRecord.email || userRecord.uid}`);
    console.log(`UID: ${userRecord.uid}`);
  } catch (error) {
    console.error("❌ Failed to update password:");
    console.error(error.message);
    process.exit(1);
  }
}

resetPassword();