import { handleApiError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/connection";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireUserId();
    const actions = await getStore().listActions(userId);
    return jsonOk({ actions });
  } catch (error) {
    return handleApiError(error);
  }
}
