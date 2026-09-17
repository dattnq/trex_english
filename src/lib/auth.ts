import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { db } from "./db";
import type { Viewer } from "./auth-types";
import { cache } from "react";

export function getAuthDestination(role: Viewer["role"]) {
  return role === "ADMIN" ? "/admin" : "/";
}

export async function ensureProfile(user: User) {
  if (!user.email_confirmed_at) {
    throw new Error("Email chưa được xác thực.");
  }

  const raw = [user.user_metadata?.display_name, user.user_metadata?.full_name, user.user_metadata?.name]
    .find(value => typeof value === "string" && value.trim());
  const displayName =
    typeof raw === "string" && raw.trim()
      ? raw.trim().slice(0, 80)
      : "Người học";
  return db.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, displayName, role: "LEARNER" },
    update: {},
  });
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email_confirmed_at) return null;
  const profile = await db.profile.findUnique({
    where: { id: data.user.id },
    select: { id: true, displayName: true, role: true, dailyGoal: true, timeZone: true },
  });
  if (!profile) return null;
  return { ...profile, email: data.user.email ?? "" };
});
export async function requireUser() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
export async function requireAdmin() {
  const viewer = await requireUser();
  if (viewer.role !== "ADMIN") redirect("/forbidden");
  return viewer;
}
