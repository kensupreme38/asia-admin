import { ManagementTable } from "@/components/dashboard/management-table";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import type { FormFieldConfig } from "@/lib/types";

// Using AdminUser type fields for the form
const userFormFields: any[] = [
    { name: "username", label: "Username", type: "text", placeholder: "johndoe" },
    { name: "full_name", label: "Full Name", type: "text", placeholder: "John Doe" },
    { name: "email", label: "Email", type: "email", placeholder: "john@example.com" },
    {
        name: "role", label: "Role", type: "select", options: [
            { value: "admin", label: "Admin" },
            { value: "member", label: "Member" },
            { value: "guest", label: "Guest" },
        ]
    },
    { name: "password", label: "Password", type: "text", placeholder: "Leave empty to keep current password (when editing)" },
];

export default async function UsersPage() {
    const supabase = await createClient();
    
    // Fetch from 'admin_users' table
    const { data: usersData, error } = await supabase
        .from('admin_users')
        .select('id, username, full_name, email, role, created_at, is_active')
        .order('created_at', { ascending: false });

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
            <ManagementTable<User>
                entityName="AdminUser"
                initialData={users}
                formFields={userFormFields}
                searchField="name"
                columns={[
                    { accessor: "name", header: "Name" },
                    { accessor: "email", header: "Email" },
                    { accessor: "role", header: "Role" },
                    { accessor: "joinDate", header: "Join Date" },
                ]}
            />
        </DashboardLayout>
    );
}
