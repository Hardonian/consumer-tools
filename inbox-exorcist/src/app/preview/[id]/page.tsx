import { PreviewClient } from "@/components/PreviewClient";
import { mockScan } from "@/lib/mock-scan";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialScan =
    id === "mock" && process.env.INBOXEXORCIST_E2E === "1"
      ? mockScan()
      : undefined;

  return <PreviewClient scanId={id} initialScan={initialScan} />;
}
