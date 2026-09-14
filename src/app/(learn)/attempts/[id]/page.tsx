import AttemptResult from "@/components/attempt-result";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AttemptResult id={id} />; }
