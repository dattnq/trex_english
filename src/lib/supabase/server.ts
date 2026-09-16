import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient(writable = false) {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(values) {
          const write = () =>
            values.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          if (writable) {
            write();
            return;
          }
          try {
            write();
          } catch {
            // Server Components cannot write cookies; proxy refreshes them.
          }
        },
      },
    },
  );
}
