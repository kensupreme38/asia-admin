import { ManagementTable } from "@/components/dashboard/management-table";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DJ } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import type { FormFieldConfig } from "@/lib/types";

const djFormFields: FormFieldConfig<DJ>[] = [
    { name: "name", label: "DJ Name", type: "text", placeholder: "DJ Awesome" },
    { name: "bio", label: "Biography", type: "text", placeholder: "Tell us about yourself..." },
    { name: "country", label: "Country", type: "text", placeholder: "Singapore, Vietnam, Thailand..." },
];

export default async function DJsPage() {
    const supabase = await createClient();
    const { data: djsData, error: djsError } = await supabase
        .from('djs')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (djsError) {
        console.error('Error fetching DJs:', djsError);
    }

    // Get all DJ IDs
    const djIds = (djsData || []).map((dj: any) => dj.id);

    // Get votes count for all DJs
    const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('dj_id')
        .in('dj_id', djIds);

    if (votesError) {
        console.error('Error fetching votes:', votesError);
    }

    // Count votes per DJ
    const votesCountMap = new Map<number, number>();
    if (votesData) {
        votesData.forEach((vote: any) => {
            const count = votesCountMap.get(vote.dj_id) || 0;
            votesCountMap.set(vote.dj_id, count + 1);
        });
    }

    const djs: DJ[] = (djsData || []).map((dj: any) => ({
        id: dj.id.toString(),
        name: dj.name,
        stageName: dj.name,
        image_url: dj.image_url,
        avatar: dj.image_url || String(Math.floor(Math.random() * 25) + 1),
        bio: dj.bio,
        genres: dj.genres || [],
        country: dj.country,
        user_id: dj.user_id,
        is_active: dj.is_active,
        status: dj.status,
        created_at: dj.created_at,
        votes_count: votesCountMap.get(dj.id) || 0, // Real vote count from votes table
        performanceCount: votesCountMap.get(dj.id) || 0, // Alias
        realName: dj.name,
        bookingContact: '',
    }));

    return (
        <DashboardLayout>
                <ManagementTable<DJ>
                    entityName="DJ"
                    initialData={djs}
                    formFields={djFormFields}
                    searchField="name"
                    columns={[
                        { accessor: "name", header: "DJ Name" },
                        { accessor: "country", header: "Country" },
                        { accessor: "bio", header: "Bio" },
                        { accessor: "votes_count", header: "Votes" },
                        { accessor: "created_at", header: "Joined" },
                    ]}
                />
        </DashboardLayout>
    );
}
