import { handleApiError, jsonOk, readJsonBody } from "@/lib/api";
import { requireGmailClient } from "@/lib/auth/connection";
import { undoActions } from "@/lib/services/undo";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

type UndoRequest = {
  actionIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<UndoRequest>(request);
    const store = getStore();
    const { userId, gmail } = await requireGmailClient(store);
    const result = await undoActions({
      userId,
      actionIds: body.actionIds,
      gmail,
      store,
    });
    return jsonOk(result, { degraded: result.failures.length > 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
