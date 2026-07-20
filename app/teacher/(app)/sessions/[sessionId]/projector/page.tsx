import { ProjectorClient } from "@/components/ProjectorClient";

type Props = { params: Promise<{ sessionId: string }> };

export default async function ProjectorPage({ params }: Props) {
  const { sessionId } = await params;
  return <ProjectorClient sessionId={sessionId} />;
}
