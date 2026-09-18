import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import TestLibrary from "@/components/test-library";

export default async function TestsPage() {
  const [rows, completed] = await Promise.all([
    db.test.findMany({
      where: { published: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, title: true, level: true, category: true, minutes: true, color: true, _count: { select: { questions: true } } },
    }),
    getViewer().then(viewer => viewer ? db.attempt.findMany({
      where: { userId: viewer.id, kind: "TEST", testId: { not: null } },
      distinct: ["testId"],
      select: { testId: true },
    }) : []),
  ]);
  return <TestLibrary completedIds={completed.flatMap(a => a.testId ? [a.testId] : [])} tests={rows.map(t => ({ ...t, questionCount: t._count.questions }))} />;
}
