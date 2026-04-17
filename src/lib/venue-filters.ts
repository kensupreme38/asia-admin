/**
 * Same option sets as asianightlife `CountrySelector` (minus "all") for admin KTV form.
 */

export const ADMIN_COUNTRIES: { value: string; label: string }[] = [
  { value: "Singapore", label: "Singapore" },
  { value: "Vietnam", label: "Vietnam" },
  { value: "Thailand", label: "Thailand" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Cambodia", label: "Cambodia" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Japan", label: "Japan" },
  { value: "Macao", label: "Macao" },
  { value: "Philippines", label: "Philippines" },
  { value: "South Korea", label: "South Korea" },
  { value: "Taiwan", label: "Taiwan" },
];

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const CITIES_BY_COUNTRY: Record<string, { value: string; label: string }[]> = {
  Singapore: [{ value: "Singapore", label: "Singapore" }],
  Vietnam: [
    { value: "Hanoi", label: "Hanoi" },
    { value: "Ha Long Bay", label: "Ha Long Bay" },
    { value: "Danang", label: "Danang" },
    { value: "Nha Trang", label: "Nha Trang" },
    { value: "Ho Chi Minh City", label: "Ho Chi Minh City" },
    { value: "Vung Tau", label: "Vung Tau" },
    { value: "Can Tho", label: "Can Tho" },
    { value: "Phu Quoc", label: "Phu Quoc" },
  ],
  Thailand: [
    { value: "Bangkok", label: "Bangkok" },
    { value: "Chiang Mai", label: "Chiang Mai" },
    { value: "Pattaya", label: "Pattaya" },
    { value: "Phuket", label: "Phuket" },
    { value: "Hat Yai", label: "Hat Yai" },
  ],
  Malaysia: [
    { value: "Penang", label: "Penang" },
    { value: "Kuala Lumpur", label: "Kuala Lumpur" },
    { value: "Johor Bahru", label: "Johor Bahru" },
    { value: "Kota Kinabalu", label: "Kota Kinabalu" },
  ],
};

export function getCitiesForCountry(country: string | undefined): { value: string; label: string }[] {
  if (!country) return [];
  return CITIES_BY_COUNTRY[country] ?? [];
}

/**
 * Used by data.ts import when `city` is missing: match address to known city names (accent-insensitive).
 * For Singapore, defaults to "Singapore" when country is Singapore.
 */
export function inferCityFromAddress(
  country: string | null | undefined,
  address: string | null | undefined
): string | null {
  const c = country?.trim();
  if (!c) return null;
  if (!address?.trim()) {
    return c === "Singapore" ? "Singapore" : null;
  }

  const folded = fold(address);
  const cities = getCitiesForCountry(c);
  const sorted = [...cities].sort((x, y) => y.value.length - x.value.length);
  for (const { value } of sorted) {
    const key = fold(value);
    if (key.length > 0 && folded.includes(key)) return value;
  }

  if (c === "Singapore") return "Singapore";
  return null;
}

/** Category ids match client `getCategories` (excluding "all"). */
export const ADMIN_CATEGORIES: { value: string; label: string }[] = [
  { value: "Night market", label: "Night market" },
  { value: "KTV", label: "KTV" },
  { value: "Nightclub / clubbing", label: "Nightclub / clubbing" },
  { value: "Live house / Beer club", label: "Live house / Beer club" },
  { value: "Pub", label: "Pub" },
  { value: "Lounge / Speakeasy bar", label: "Lounge / Speakeasy bar" },
  { value: "Sky Bar", label: "Sky Bar" },
  { value: "Spa / Osen", label: "Spa / Osen" },
  { value: "Massage", label: "Massage" },
  { value: "Hotel", label: "Hotel" },
  { value: "Restaurants", label: "Restaurants" },
  { value: "Breakfast", label: "Breakfast" },
  { value: "Supper (after 12 midnight)", label: "Supper (after 12 midnight)" },
];
