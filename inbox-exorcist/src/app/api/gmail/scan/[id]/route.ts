import { handleApiError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/connection";
import { AppError } from "@/lib/errors";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const userId = await requireUserId();
    const store = getStore();
    const scan = await store.getScanRun(id, userId);
    if (!scan) {
      throw new AppError({
        code: "SCAN_NOT_FOUND",
        message: "That scan was not found for this user.",
        status: 404,
      });
    }
    const candidates = await store.listCandidates(id, userId);
    return jsonOk({ ...scan, candidates }, { degraded: scan.degraded });
  } catch (error) {
    return handleApiError(error);
  }
}
