import { DJTable } from "@/components/dashboard/tables/dj-table";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { DJ } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function DJsPage() {
    const supabase = await createClient();
    const { data: djsData, error: djsError, count } = await supabase
        .from('djs')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(0, 9);

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
            <DJTable initialData={djs} initialTotal={count || 0} />
        </DashboardLayout>
    );
}
