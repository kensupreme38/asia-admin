# Asia Admin

Admin dashboard for managing users, employees, and DJs.

## Features

- Admin authentication system (without external auth providers)
- User management with roles and permissions
- Employee management
- DJ management
- Protected routes with middleware

## Setup

### 1. Database Migration

Run the migration to create the `admin_users` table:

```sql
-- Run the migration file: supabase/migrations/20240101000000_create_admin_users.sql
```

### 2. Create First Admin User

You have two options:

**Option A: Using the script (Recommended)**
```bash
npx tsx scripts/create-admin.ts
```

**Option B: Manual SQL Insert**
```sql
-- Generate a password hash first (you can use bcrypt online tools or the script)
-- Then insert:
INSERT INTO admin_users (username, password_hash, full_name, email, role, permissions, is_active)
VALUES (
  'admin',
  '$2b$10$YOUR_HASHED_PASSWORD_HERE',
  'Administrator',
  'admin@example.com',
  'super_admin',
  '{"users": {"create": true, "read": true, "update": true, "delete": true}, "employees": {"create": true, "read": true, "update": true, "delete": true}, "djs": {"create": true, "read": true, "update": true, "delete": true}}'::jsonb,
  true
);
```

### 3. Environment Variables

Make sure you have these environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Usage

1. Navigate to `/login` and log in with your admin credentials
2. After login, you'll be redirected to the dashboard
3. Use the navigation to access:
   - **Users**: Manage regular users
   - **Employees**: Manage employees
   - **DJs**: Manage DJs
   - **Admin Users**: Manage admin users and permissions

## Admin User Management

- Create new admin users with different roles (super_admin, admin, moderator)
- Set permissions for each user
- Activate/deactivate users
- Change passwords

## Security Notes

- Passwords are hashed using bcrypt
- Sessions are stored in HTTP-only cookies
- All routes except `/login` are protected by middleware
- Admin users table stores password hashes, not plain text passwords
