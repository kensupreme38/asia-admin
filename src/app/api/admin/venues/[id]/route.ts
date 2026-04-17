import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function resolveMapEmbedUrl(mapEmbedUrl: unknown, address: unknown): string | null {
  if (typeof mapEmbedUrl === "string" && mapEmbedUrl.trim().length > 0) {
    return mapEmbedUrl.trim();
  }
  if (typeof address === "string" && address.trim().length > 0) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(address.trim())}&output=embed`;
  }
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const supabase = createAdminClient() || (await createClient());

    const { data: currentVenue } = await supabase
      .from("venues")
      .select("id,name,slug")
      .eq("id", id)
      .single();

    if (!currentVenue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const nextSlug = body.slug || (body.name ? generateSlug(body.name) : currentVenue.slug);
    if (nextSlug && nextSlug !== currentVenue.slug) {
      const { data: sameSlugVenue } = await supabase
        .from("venues")
        .select("id")
        .eq("slug", nextSlug)
        .neq("id", id)
        .single();

      if (sameSlugVenue) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const updateData: Record<string, any> = {};
    const keys = [
      "name",
      "main_image_url",
      "map_embed_url",
      "category",
      "address",
      "price",
      "country",
      "city",
      "phone",
      "hours",
      "description",
      "status",
    ];

    keys.forEach((key) => {
      if (body[key] === undefined) return;

      if (key === "map_embed_url") {
        updateData.map_embed_url = resolveMapEmbedUrl(body.map_embed_url, body.address);
        return;
      }

      updateData[key] = body[key] || null;
    });

    if (body.images !== undefined) {
      updateData.images = normalizeImages(body.images);
    }

    updateData.slug = nextSlug;

    const { data, error } = await supabase
      .from("venues")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update venue" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const supabase = createAdminClient() || (await createClient());
    const { error } = await supabase.from("venues").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete venue" }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
