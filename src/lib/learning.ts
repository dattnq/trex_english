import "server-only";
import { db } from "@/lib/db";
import type { Viewer } from "@/lib/auth-types";
export function visibleDecks(viewer: Viewer | null) {
  return { OR: [{ visibility: "PUBLIC" as const },
    ...(viewer ? [{ ownerId: viewer.id }] : [])] };
}
export async function readDeck(id: string, viewer: Viewer | null) {
  return db.deck.findFirst({ where: { id, ...visibleDecks(viewer) },
    include: { words: { orderBy: [{ position:"asc" },{ id:"asc" }] } } });
}
export function dayKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone,
    year:"numeric",month:"2-digit",day:"2-digit" }).formatToParts(date);
  const value=(type:string) => parts.find(p => p.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
