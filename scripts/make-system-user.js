require("dotenv").config();

const mongoose = require("mongoose");
const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");

async function makeSystemUser() {
  const email = process.argv[2];

  if (!email) {
    throw new Error("Usage: node scripts/make-system-user.js <email>");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await userModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new Error(`No user found with email "${email}"`);
  }

  await userModel.collection.updateOne(
    { _id: user._id },
    { $set: { systemUser: true } },
  );

  await accountModel.findOneAndUpdate(
    { user: user._id },
    { $setOnInsert: { user: user._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`System user enabled for ${user.email}`);
  console.log(`User ID: ${user._id}`);
}

makeSystemUser()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
