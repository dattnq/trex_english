import StudySession from "@/components/study-session";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <StudySession id={id} />; }
