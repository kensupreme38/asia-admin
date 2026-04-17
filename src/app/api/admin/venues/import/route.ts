import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { inferCityFromAddress } from "@/lib/venue-filters";

type RawVenue = {
  name?: string;
  slug?: string;
  main_image_url?: string;
  images?: string[];
  mapEmbedUrl?: string;
  category?: string;
  address?: string;
  price?: string;
  country?: string;
  /** Optional in data.ts; otherwise inferred from address + country */
  city?: string;
  phone?: string;
  hours?: string | Record<string, string>;
  description?: string;
};

type NormalizedVenue = {
  name: string;
  slug: string;
  main_image_url: string | null;
  images: string[];
  map_embed_url: string | null;
  category: string;
  address: string | null;
  price: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  hours: string | null;
  description: string | null;
  status: string;
};

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function loadRawData(): Promise<RawVenue[]> {
  const dataFile = path.resolve(process.cwd(), "../asianightlife/src/lib/data.ts");
  const source = await readFile(dataFile, "utf-8");
  const executableSource = source.replace("export const ktvData =", "const ktvData =");
  const loader = new Function(`${executableSource}\nreturn ktvData;`);
  const loaded = loader();

  if (!Array.isArray(loaded)) {
    throw new Error("Invalid ktvData format");
  }

  return loaded as RawVenue[];
}

function normalizeHours(hours: RawVenue["hours"]): string | null {
  if (!hours) return null;
  if (typeof hours === "string") return hours;
  return JSON.stringify(hours);
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return Array.from(
    new Set(
      images
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
    )
  );
}

function normalizeVenue(item: RawVenue): NormalizedVenue | null {
  if (typeof item.name !== "string" || item.name.trim().length === 0) {
    return null;
  }

  const images = normalizeImages(item.images);
  const mainImage = item.main_image_url?.trim() || images[0] || null;
  const baseSlug = item.slug?.trim() || generateSlug(item.name.trim());
  const country = item.country?.trim() || null;
  const address = item.address?.trim() || null;
  const explicitCity = item.city?.trim() || null;
  const inferredCity = inferCityFromAddress(country, address);
  const city = explicitCity || inferredCity || null;

  return {
    name: item.name.trim(),
    slug: baseSlug,
    main_image_url: mainImage,
    images,
    map_embed_url: item.mapEmbedUrl?.trim() || null,
    category: item.category?.trim() || "KTV",
    address,
    price: item.price?.trim() || null,
    country,
    city,
    phone: item.phone?.trim() || null,
    hours: normalizeHours(item.hours),
    description: item.description?.trim() || null,
    status: item.name?.toLowerCase().includes("closed") ? "inactive" : "active",
  };
}

function buildFingerprint(item: { name?: string | null; country?: string | null; address?: string | null }) {
  return `${(item.name || "").trim().toLowerCase()}|${(item.country || "").trim().toLowerCase()}|${(item.address || "")
    .trim()
    .toLowerCase()}`;
}

export async function POST() {
  try {
    await requireAuth();

    const rawVenues = await loadRawData();
    const supabase = createAdminClient() || (await createClient());
    const normalizedRows = rawVenues.map(normalizeVenue).filter((item): item is NormalizedVenue => item !== null);

    const { data: existingRows, error: existingError } = await supabase
      .from("venues")
      .select("id,slug,name,country,address");

    if (existingError) {
      return NextResponse.json({ error: "Failed to read existing venues", details: existingError.message }, { status: 500 });
    }

    const existingBySlug = new Map<string, { id: string }>();
    const existingByFingerprint = new Map<string, { id: string }>();
    const usedSlugs = new Set<string>();

    (existingRows || []).forEach((row: any) => {
      if (row.slug) {
        const slug = String(row.slug).trim();
        usedSlugs.add(slug);
        existingBySlug.set(slug, { id: String(row.id) });
      }
      const fingerprint = buildFingerprint({
        name: row.name,
        country: row.country,
        address: row.address,
      });
      if (fingerprint !== "||") {
        existingByFingerprint.set(fingerprint, { id: String(row.id) });
      }
    });

    const updates: Array<Promise<any>> = [];
    const inserts: NormalizedVenue[] = [];
    const payloadSlugCount = new Map<string, number>();

    for (const row of normalizedRows) {
      const fingerprint = buildFingerprint(row);
      const existingByExactSlug = existingBySlug.get(row.slug);
      const existingByIdentity = existingByFingerprint.get(fingerprint);
      const target = existingByExactSlug || existingByIdentity;

      if (target?.id) {
        updates.push(
          supabase
            .from("venues")
            .update({
              name: row.name,
              slug: row.slug,
              main_image_url: row.main_image_url,
              images: row.images,
              map_embed_url: row.map_embed_url,
              category: row.category,
              address: row.address,
              price: row.price,
              country: row.country,
              city: row.city,
              phone: row.phone,
              hours: row.hours,
              description: row.description,
              status: row.status,
            })
            .eq("id", target.id)
        );
        usedSlugs.add(row.slug);
        continue;
      }

      const currentCount = payloadSlugCount.get(row.slug) ?? 0;
      payloadSlugCount.set(row.slug, currentCount + 1);

      let candidateSlug = row.slug;
      let suffix = currentCount + 1;
      while (usedSlugs.has(candidateSlug)) {
        suffix += 1;
        candidateSlug = `${row.slug}-${suffix}`;
      }
      usedSlugs.add(candidateSlug);
      inserts.push({ ...row, slug: candidateSlug });
    }

    if (updates.length > 0) {
      const updateResults = await Promise.all(updates);
      const failedUpdate = updateResults.find((result) => result.error);
      if (failedUpdate?.error) {
        return NextResponse.json(
          { error: "Failed to update existing venues", details: failedUpdate.error.message },
          { status: 500 }
        );
      }
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from("venues").insert(inserts);
      if (insertError) {
        return NextResponse.json({ error: "Failed to insert new venues", details: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      imported: normalizedRows.length,
      updatedRows: updates.length,
      insertedRows: inserts.length,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
