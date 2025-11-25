/**
 * Script to generate bcrypt password hash
 * Usage: node scripts/generate-password-hash.js <password>
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.error('Usage: node scripts/generate-password-hash.js <password>');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('\nPassword Hash:');
  console.log(hash);
  console.log('\nSQL INSERT statement:');
  console.log(`
INSERT INTO admin_users (username, password_hash, full_name, email, role, permissions, is_active)
VALUES (
  'admin',
  '${hash}',
  'Administrator',
  'admin@example.com',
  'super_admin',
  '{"users": {"create": true, "read": true, "update": true, "delete": true}, "employees": {"create": true, "read": true, "update": true, "delete": true}, "djs": {"create": true, "read": true, "update": true, "delete": true}, "admin_users": {"create": true, "read": true, "update": true, "delete": true}}'::jsonb,
  true
);
  `);
}

generateHash().catch(console.error);

