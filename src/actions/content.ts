"use server";
import { suggestLocalIpa } from "@/lib/local-pronunciation";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  contentInput,
  deleteInput,
  type ContentInput,
  type ContentResult,
} from "@/lib/content-schema";
class ContentError extends Error {}
function checkVersion(existing: { updatedAt: Date } | null, version?: string) {
  if (!existing)
    throw new ContentError(
      "Nội dung đã bị xóa. Quay lại danh sách để kiểm tra.",
    );
  if (existing.updatedAt.toISOString() !== version)
    throw new ContentError(
      "Nội dung đã được sửa ở nơi khác. Sao chép phần bạn đang viết rồi tải lại trang trước khi lưu.",
    );
}
function failure(error: unknown): ContentResult {
  return {
    ok: false,
    message:
      error instanceof ContentError
        ? error.message
        : "Không thể cập nhật database. Vui lòng thử lại sau.",
  };
}
export async function writeContent(raw: ContentInput): Promise<ContentResult> {
  const viewer = await requireUser(),
    parsed = contentInput.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(" · "),
    };
  const value = parsed.data;
  try {
    const id = await db.$transaction(
      async (tx) => {
        // Shared with role changes, so revoked admins cannot keep writing.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(73191, 1)`;
        const actor = await tx.profile.findUnique({
          where: { id: viewer.id },
          select: { role: true },
        });
        if (actor?.role !== "ADMIN")
          throw new ContentError("Bạn không có quyền quản trị.");
        const id = value.id ?? randomUUID();
        const common = {
          title: value.title,
          description: value.description,
          category: value.category,
          level: value.level,
          color: value.color,
        };
        if (value.kind === "test") {
          if (value.id) {
            checkVersion(
              await tx.test.findUnique({
                where: { id },
                select: { updatedAt: true },
              }),
              value.version,
            );
            await tx.test.update({
              where: { id },
              data: {
                ...common,
                minutes: value.minutes,
                published: value.published,
              },
            });
          } else
            await tx.test.create({
              data: {
                id,
                ...common,
                minutes: value.minutes,
                published: value.published,
              },
            });
          await tx.testQuestion.deleteMany({ where: { testId: id } });
          if (value.questions.length)
            await tx.testQuestion.createMany({
              data: value.questions.map((q, position) => ({
                ...q,
                testId: id,
                position,
              })),
            });
        } else {
          const existing = value.id
            ? await tx.deck.findUnique({
                where: { id },
                select: { updatedAt: true, ownerId: true },
              })
            : null;
          if (value.id) checkVersion(existing, value.version);
          const data = {
            ...common,
            symbol: value.symbol,
            visibility: value.published
              ? ("PUBLIC" as const)
              : ("PRIVATE" as const),
            ownerId: existing?.ownerId ?? (value.published ? null : viewer.id),
          };
          if (value.id) await tx.deck.update({ where: { id }, data });
          else await tx.deck.create({ data: { id, ...data } });
          // Retain word IDs and their learning progress when editing/reordering.
          await tx.word.deleteMany({
            where: { deckId: id, id: { notIn: value.words.map((w) => w.id) } },
          });
          for (const [position, word] of value.words.entries()) {
            const enriched = { ...word, phonetic: word.phonetic || suggestLocalIpa(word.term) };
            await tx.word.upsert({
              where: { deckId_id: { deckId: id, id: word.id } },
              create: { ...enriched, deckId: id, position },
              update: { ...enriched, position },
            });
          }
        }
        return id;
      },
      { isolationLevel: "ReadCommitted", timeout: 20000 },
    );
    revalidatePath("/", "layout");
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}
export async function deleteContent(raw: {
  kind: "deck" | "test";
  id: string;
  version: string;
}): Promise<ContentResult> {
  const viewer = await requireUser(),
    parsed = deleteInput.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      message: "Yêu cầu xóa không hợp lệ. Hãy tải lại trang.",
    };
  const { kind, id, version } = parsed.data;
  try {
    await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(73191, 1)`;
        const actor = await tx.profile.findUnique({
          where: { id: viewer.id },
          select: { role: true },
        });
        if (actor?.role !== "ADMIN")
          throw new ContentError("Bạn không có quyền quản trị.");
        checkVersion(
          kind === "deck"
            ? await tx.deck.findUnique({
                where: { id },
                select: { updatedAt: true },
              })
            : await tx.test.findUnique({
                where: { id },
                select: { updatedAt: true },
              }),
          version,
        );
        if (kind === "deck") await tx.deck.delete({ where: { id } });
        else await tx.test.delete({ where: { id } });
      },
      { isolationLevel: "ReadCommitted" },
    );
    revalidatePath("/", "layout");
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}
