/** Port di onezone.service.ts — banner WordPress della home. */

export async function banner(): Promise<unknown> {
  try {
    const res = await fetch("https://onezone.ch/wp-json/wp/v2/banner");
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
