import "server-only";

export function appOrigin() {
  const value = process.env.APP_URL;
  if (!value) throw new Error("Thiếu APP_URL trong cấu hình server.");
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("APP_URL không hợp lệ.");
  return url.origin;
}

// Query public provider settings so an unconfigured provider shows a friendly
// message instead of sending the learner to a raw Supabase error page.
export async function googleProviderEnabled(): Promise<boolean> {
  const response = await fetch(new URL('/auth/v1/settings', process.env.NEXT_PUBLIC_SUPABASE_URL!), {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    cache: 'no-store', signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Auth settings unavailable');
  const settings = await response.json();
  if (typeof settings.external?.google !== 'boolean') throw new Error('Invalid Auth settings');
  return settings.external.google;
}
