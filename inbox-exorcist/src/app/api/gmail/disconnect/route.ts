import { handleApiError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/connection";
import { revokeGoogleToken } from "@/lib/gmail/oauth";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST() {
  try {
    const userId = await requireUserId();
    const store = getStore();
    const connection = await store.getConnection(userId);
    let revokeFailed = false;
    if (connection) {
      try {
        await revokeGoogleToken(connection);
      } catch {
        revokeFailed = true;
      }
    }
    await store.deleteConnection(userId);
    return jsonOk(
      { disconnected: true, revokeFailed },
      { degraded: revokeFailed },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
