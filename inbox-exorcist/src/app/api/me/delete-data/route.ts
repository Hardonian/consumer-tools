import { handleApiError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/connection";
import { clearSession } from "@/lib/security/session";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST() {
  try {
    const userId = await requireUserId();
    await getStore().deleteUserData(userId);
    await clearSession();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
