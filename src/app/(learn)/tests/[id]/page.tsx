import QuestionSession from "@/components/question-session";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <QuestionSession id={id} />; }
