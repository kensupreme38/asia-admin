/**
 * Script to create the first admin user
 * Run with: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if any admin users exist
  const { data: existingUsers } = await supabase
    .from('admin_users')
    .select('id')
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    console.log('Admin users already exist. Use the admin panel to create new users.');
    rl.close();
    return;
  }

  console.log('Creating first admin user...\n');

  const username = await question('Username: ');
  const password = await question('Password: ');
  const fullName = await question('Full Name (optional): ');
  const email = await question('Email (optional): ');

  if (!username || !password) {
    console.error('Error: Username and password are required');
    rl.close();
    process.exit(1);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert admin user
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      username,
      password_hash: passwordHash,
      full_name: fullName || null,
      email: email || null,
      role: 'super_admin',
      permissions: {
        users: { create: true, read: true, update: true, delete: true },
        employees: { create: true, read: true, update: true, delete: true },
        djs: { create: true, read: true, update: true, delete: true },
        admin_users: { create: true, read: true, update: true, delete: true },
      },
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating admin user:', error);
    rl.close();
    process.exit(1);
  }

  console.log('\n✅ Admin user created successfully!');
  console.log(`Username: ${data.username}`);
  console.log(`Role: ${data.role}`);
  rl.close();
}

createAdmin().catch((error) => {
  console.error('Unexpected error:', error);
  rl.close();
  process.exit(1);
});

