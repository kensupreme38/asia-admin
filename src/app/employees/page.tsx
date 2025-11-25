import { ManagementTable } from "@/components/dashboard/management-table";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { Employee } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import type { FormFieldConfig } from "@/lib/types";

const employeeFormFields: FormFieldConfig<Employee>[] = [
    { name: "full_name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
    { name: "email", label: "Email", type: "email", placeholder: "jane@work.com" },
    { name: "phone", label: "Phone Number", type: "text", placeholder: "+84 908 123 456" },
    { name: "dateOfBirth", label: "Date of Birth", type: "date" },
    {
        name: "gender", label: "Gender", type: "select", options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
        ]
    },
    { name: "address", label: "Address", type: "text", placeholder: "123 Main Street, City" },
    { name: "referral_code", label: "Referral Code", type: "text", placeholder: "ABC123" },
];

export default async function EmployeesPage() {
    const supabase = await createClient();
    const { data: employeesData, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .order('created_at', { ascending: false });

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
                <ManagementTable<Employee>
                    entityName="Employee"
                    initialData={employees}
                    formFields={employeeFormFields}
                    searchField="name"
                    columns={[
                        { accessor: "name", header: "Name" },
                        { accessor: "email", header: "Email" },
                        { accessor: "phone", header: "Phone" },
                        { accessor: "gender", header: "Gender" },
                        { accessor: "referral_code", header: "Referral Code" },
                        { accessor: "startDate", header: "Joined" },
                    ]}
                />
        </DashboardLayout>
    );
}
