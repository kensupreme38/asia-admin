import { EmployeeTable } from "@/components/dashboard/tables/employee-table";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { Employee } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function EmployeesPage() {
    const supabase = await createClient();
    const { data: employeesData, error, count } = await supabase
        .from('employee_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 9);

    const employees: Employee[] = (employeesData || []).map((emp: any) => ({
        id: emp.id,
        name: emp.full_name || emp.email?.split('@')[0] || 'Unknown',
        full_name: emp.full_name,
        email: emp.email,
        avatar: emp.avatar || String(Math.floor(Math.random() * 25) + 1),
        // asianightlife doesn't have department/jobTitle - setting defaults for type compatibility
        department: 'Engineering' as const,
        jobTitle: 'Employee',
        phone: emp.phone,
        dateOfBirth: emp.date_of_birth,
        gender: emp.gender,
        address: emp.address,
        startDate: emp.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        user_id: emp.user_id,
        referral_code: emp.referral_code,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
    }));

    if (error) {
        console.error('Error fetching employees:', error);
    }

    return (
        <DashboardLayout>
            <EmployeeTable initialData={employees} initialTotal={count || 0} />
        </DashboardLayout>
    );
}
