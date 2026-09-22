import { ScanClient } from "@/components/ScanClient";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string }>;
}) {
  const params = await searchParams;
  return <ScanClient autoStart={params.connected === "1"} />;
}
