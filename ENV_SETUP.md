# Environment Variables Setup

## Required for Admin Operations

Để các chức năng CRUD admin hoạt động đúng, bạn cần thêm Service Role Key vào file `.env.local`:

### 1. Lấy Service Role Key từ Supabase:

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Tìm **service_role** key (secret) - **KHÔNG chia sẻ key này**
5. Copy key này

### 2. Thêm vào `.env.local`:

Tạo hoặc cập nhật file `.env.local` trong root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Required for Admin Operations (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Restart Development Server:

Sau khi thêm Service Role Key, restart server:

```bash
npm run dev
```

## Lưu ý bảo mật:

⚠️ **QUAN TRỌNG:**
- **KHÔNG** commit file `.env.local` vào git
- **KHÔNG** chia sẻ Service Role Key
- Service Role Key có quyền bypass tất cả RLS policies
- Chỉ dùng trong server-side code (API routes)

## Kiểm tra:

Sau khi thêm key, bạn sẽ thấy log trong console:
```
[DELETE DJ] Using service role key to bypass RLS
```

Nếu không thấy log này, kiểm tra lại:
1. Key đã được thêm vào `.env.local` chưa?
2. Server đã được restart chưa?
3. Tên biến có đúng `SUPABASE_SERVICE_ROLE_KEY` không?

