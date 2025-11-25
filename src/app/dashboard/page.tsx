import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Music, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  const supabase = await createClient();

  // Fetch counts for each entity
  const [usersResult, employeesResult, djsResult] = await Promise.all([
    supabase.from('admin_users').select('id', { count: 'exact', head: true }),
    supabase.from('employee_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('djs').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const usersCount = usersResult.count || 0;
  const employeesCount = employeesResult.count || 0;
  const djsCount = djsResult.count || 0;
  const totalCount = usersCount + employeesCount + djsCount;

  const stats = [
    {
      title: "Total Users",
      value: usersCount,
      description: "Registered admin users",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Employees",
      value: employeesCount,
      description: "Active employee profiles",
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "DJs",
      value: djsCount,
      description: "Active DJ profiles",
      icon: Music,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Records",
      value: totalCount,
      description: "All entities combined",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your management system
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common management tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Users:</strong> Manage admin users and permissions
              </div>
              <div className="text-sm">
                <strong>Employees:</strong> View and manage employee profiles
              </div>
              <div className="text-sm">
                <strong>DJs:</strong> Manage DJ profiles and performances
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current system health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API</span>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>All systems operational</div>
                <div>No pending actions</div>
                <div>Last sync: Just now</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

