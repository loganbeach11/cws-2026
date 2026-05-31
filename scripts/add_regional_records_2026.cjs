// scripts/add_regional_records_2026.cjs
const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addRegionalRecords() {
  const regionalsRef = db.collection("regionals2026").doc("regions");
  const snapshot = await regionalsRef.get();

  if (!snapshot.exists) {
    console.error("❌ regionals2026/regions does not exist.");
    process.exit(1);
  }

  const regionals = snapshot.data() || {};
  const updates = {};

  Object.entries(regionals).forEach(([regionalId, regional]) => {
    updates[`${regionalId}.team1Record`] = regional?.team1Record || "0-0";
    updates[`${regionalId}.team2Record`] = regional?.team2Record || "0-0";
    updates[`${regionalId}.team3Record`] = regional?.team3Record || "0-0";
    updates[`${regionalId}.team4Record`] = regional?.team4Record || "0-0";
  });

  await regionalsRef.update(updates);

  console.log("✅ Added default 0-0 records to all regionals.");
}

addRegionalRecords().catch((error) => {
  console.error("❌ Failed to add regional records:");
  console.error(error);
  process.exit(1);
});
/*
  Commands:

  Dry run / preview only:
  node scripts/update_regional_records_from_scores_2026.cjs --from=2026-05-29 --to=2026-06-01

  Write updates to Firestore:
  node scripts/update_regional_records_from_scores_2026.cjs --from=2026-05-29 --to=2026-06-01 --write
*/