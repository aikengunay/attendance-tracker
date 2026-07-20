import { RosterClient } from "@/components/RosterClient";

type Props = { params: Promise<{ sessionId: string }> };

export default async function RosterPage({ params }: Props) {
  const { sessionId } = await params;
  return <RosterClient sessionId={sessionId} />;
}
