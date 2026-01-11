import { UserTable } from "@/components/dashboard/tables/user-table";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
    const supabase = await createClient();
    
    // Fetch first page from 'admin_users' table
    const { data: usersData, error, count } = await supabase
        .from('admin_users')
        .select('id, username, full_name, email, role, created_at, is_active', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 9);

    const users: User[] = (usersData || []).map((user: any) => {
        // Map role from admin_users format to User type format
        let mappedRole: 'Admin' | 'Member' | 'Guest' = 'Member';
        if (user.role) {
            const roleLower = user.role.toLowerCase();
            if (roleLower.includes('admin') || roleLower.includes('super')) {
                mappedRole = 'Admin';
            } else if (roleLower.includes('moderator') || roleLower.includes('member')) {
                mappedRole = 'Member';
            } else {
                mappedRole = 'Guest';
            }
        }

        // Generate avatar from username or id
        const avatarSeed = user.username || user.id?.toString() || 'default';
        const avatarNumber = Math.abs(avatarSeed.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 25 + 1;

        return {
            id: user.id?.toString() || `user-${Date.now()}-${Math.random()}`,
            name: user.full_name || user.username || user.email?.split('@')[0] || 'Unknown',
            email: user.email || '',
            avatar: String(avatarNumber),
            role: mappedRole,
            joinDate: user.created_at 
                ? (typeof user.created_at === 'string' ? user.created_at.split('T')[0] : user.created_at)
                : new Date().toISOString().split('T')[0],
            // Add AdminUser fields for form compatibility
            username: user.username,
            full_name: user.full_name,
        } as any;
    });

    if (error) {
        console.error('Error fetching users:', error);
    }

    return (
        <DashboardLayout>
            <UserTable initialData={users} initialTotal={count || 0} />
        </DashboardLayout>
    );
}
