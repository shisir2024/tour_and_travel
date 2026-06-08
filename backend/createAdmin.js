/**
 * Run this once to create or promote admin users.
 * Usage: node createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./Models/UserModel');

// ✏️  Change these before running
const ADMIN_NAME = 'Super Admin';

// Add as many admins as you want.
// Passwords will be hashed automatically.
const ADMINS = [
  { email: 'adminshisir@gmail.com', password: 'shisir@12345' },
  { email: 'suriyasekar626@gmail.com', password: 'suriya@123' },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to MongoDB:', process.env.MONGO_URL);

  for (const admin of ADMINS) {
    const { email, password } = admin;

    // Find by email (single admin record per email)
    const existing = await User.findOne({ email });

    const hashed = await bcrypt.hash(password, 10);

    if (existing) {
      // Promote existing user to admin and reset password
      existing.role = 'admin';
      existing.password = hashed;
      existing.isActive = true;
      await existing.save();
      console.log(`🔄 Existing user promoted to admin: ${email}`);
    } else {
      // Create fresh admin account
      await User.create({
        name: ADMIN_NAME,
        email,
        password: hashed,
        role: 'admin',
        isActive: true,
      });
      console.log(`🎉 Admin user created: ${email}`);
    }
  }

  console.log('─────────────────────────────');
  console.log('  Admins created/promoted.');
  console.log('─────────────────────────────');
  console.log('✅ Done. You can now log in.');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

