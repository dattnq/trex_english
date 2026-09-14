import DeckDetail from "@/components/deck-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <DeckDetail id={id} />; }
