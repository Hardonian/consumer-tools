import { NextRequest } from "next/server";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/connection";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireUserId();
    const allowlist = await getStore().listAllowlist(userId);
    return jsonOk({ allowlist });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = (await request.json().catch(() => ({}))) as { domain?: string };
    const domain = body.domain?.toLowerCase().trim();

    if (!domain || domain.length < 3 || !domain.includes(".")) {
      return jsonOk(
        { message: "Invalid domain format provided" },
        { degraded: true },
      );
    }

    const store = getStore();
    await store.addAllowlist(userId, domain);
    const allowlist = await store.listAllowlist(userId);

    return jsonOk({ success: true, domain, allowlist });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = (await request.json().catch(() => ({}))) as { domain?: string };
    const domain =
      body.domain?.toLowerCase().trim() ||
      request.nextUrl.searchParams.get("domain")?.toLowerCase().trim();

    if (!domain) {
      return jsonOk(
        { message: "Domain is required to remove from allowlist" },
        { degraded: true },
      );
    }

    const store = getStore();
    await store.removeAllowlist(userId, domain);
    const allowlist = await store.listAllowlist(userId);

    return jsonOk({ success: true, domain, allowlist });
  } catch (error) {
    return handleApiError(error);
  }
}
