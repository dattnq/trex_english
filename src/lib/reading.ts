import { z } from "zod";

export const readingSchema = z.object({
  id: z.string().min(1).max(160),
  documents: z.array(z.object({
    format: z.enum(["article", "email", "website"]),
    title: z.string().trim().max(200),
    content: z.string().trim().min(1, "Nhập nội dung bài đọc").max(12000),
  })).min(1).max(3),
});
export type Reading = z.infer<typeof readingSchema>;
