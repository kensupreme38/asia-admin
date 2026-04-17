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

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const supabase = createAdminClient() || (await createClient());
    let query = supabase.from("venues").select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,address.ilike.%${search}%,country.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const {
      name,
      main_image_url,
      images,
      map_embed_url,
      category,
      address,
      price,
      country,
      city,
      phone,
      hours,
      description,
      status,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Venue name is required" }, { status: 400 });
    }

    const slug = body.slug || generateSlug(name);
    const supabase = createAdminClient() || (await createClient());

    const { data: existingSlug } = await supabase.from("venues").select("id").eq("slug", slug).single();
    if (existingSlug) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("venues")
      .insert({
        name,
        slug,
        main_image_url: main_image_url || null,
        images: normalizeImages(images),
        map_embed_url: resolveMapEmbedUrl(map_embed_url, address),
        category: category || "KTV",
        address: address || null,
        price: price || null,
        country: country || null,
        city: typeof city === "string" && city.trim() ? city.trim() : null,
        phone: phone || null,
        hours: hours || null,
        description: description || null,
        status: status || "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
