import { Briefcase, Music, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManagementTable } from "@/components/dashboard/management-table";
import type { User, Employee, DJ } from "@/lib/types";
import { users, employees, djs } from "@/lib/data";
import { userSchema, employeeSchema, djSchema } from "@/lib/schemas";
import type { FormFieldConfig } from "@/lib/types";

const userFormFields: FormFieldConfig<User>[] = [
  { name: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
  { name: "email", label: "Email", type: "email", placeholder: "john@example.com" },
  { name: "role", label: "Role", type: "select", options: [
    { value: "Admin", label: "Admin" },
    { value: "Member", label: "Member" },
    { value: "Guest", label: "Guest" },
  ]},
  { name: "joinDate", label: "Join Date", type: "date" },
];

const employeeFormFields: FormFieldConfig<Employee>[] = [
  { name: "name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
  { name: "email", label: "Email", type: "email", placeholder: "jane@work.com" },
  { name: "department", label: "Department", type: "select", options: [
    { value: "Engineering", label: "Engineering" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Marketing", label: "Marketing" },
    { value: "Sales", label: "Sales" },
  ]},
  { name: "jobTitle", label: "Job Title", type: "text", placeholder: "Software Engineer" },
  { name: "startDate", label: "Start Date", type: "date" },
];

const djFormFields: FormFieldConfig<DJ>[] = [
  { name: "stageName", label: "Stage Name", type: "text", placeholder: "DJ Groove" },
  { name: "realName", label: "Real Name", type: "text", placeholder: "Alex Ray" },
  { name: "genres", label: "Music Genres", type: "text", placeholder: "Techno, House" },
  { name: "bookingContact", label: "Booking Contact", type: "email", placeholder: "booking@djgroove.com" },
  { name: "performanceCount", label: "Performances", type: "number", placeholder: "50" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3 md:w-fit">
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="employees"><Briefcase className="mr-2 h-4 w-4" />Employees</TabsTrigger>
            <TabsTrigger value="djs"><Music className="mr-2 h-4 w-4" />DJs</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <ManagementTable<User>
              entityName="User"
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
          </TabsContent>
          <TabsContent value="employees">
            <ManagementTable<Employee>
              entityName="Employee"
              initialData={employees}
              formFields={employeeFormFields}
              searchField="name"
              columns={[
                { accessor: "name", header: "Name" },
                { accessor: "email", header: "Email" },
                { accessor: "department", header: "Department" },
                { accessor: "jobTitle", header: "Job Title" },
                { accessor: "startDate", header: "Start Date" },
              ]}
            />
          </TabsContent>
          <TabsContent value="djs">
            <ManagementTable<DJ>
              entityName="DJ"
              initialData={djs}
              formFields={djFormFields}
              searchField="stageName"
              columns={[
                { accessor: "stageName", header: "Stage Name" },
                { accessor: "realName", header: "Real Name" },
                { accessor: "genres", header: "Genres" },
                { accessor: "bookingContact", header: "Booking Contact" },
                { accessor: "performanceCount", header: "Performances" },
              ]}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
