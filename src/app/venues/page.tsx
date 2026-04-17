import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { VenueTable } from "@/components/dashboard/tables/venue-table";
import type { Venue } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function VenuesPage() {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("venues")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, 9);

  if (error) {
    console.error("Error fetching venues:", error);
  }

  const initialData: Venue[] = (data || []).map((venue: any) => ({
    id: String(venue.id),
    name: venue.name,
    slug: venue.slug,
    main_image_url: venue.main_image_url,
    images: Array.isArray(venue.images) ? venue.images : [],
    map_embed_url: venue.map_embed_url,
    category: venue.category,
    address: venue.address,
    price: venue.price,
    country: venue.country,
    city: venue.city,
    phone: venue.phone,
    hours: venue.hours,
    description: venue.description,
    status: venue.status,
    created_at: venue.created_at,
    updated_at: venue.updated_at,
  }));

  return (
    <DashboardLayout>
      <VenueTable initialData={initialData} initialTotal={count || 0} />
    </DashboardLayout>
  );
}
