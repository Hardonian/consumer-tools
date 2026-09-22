import { handleApiError, jsonOk, readJsonBody } from "@/lib/api";
import { requireGmailClient } from "@/lib/auth/connection";
import { AppError } from "@/lib/errors";
import { quietSenders } from "@/lib/services/quiet";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

type QuietRequest = {
  scanId?: string;
  candidateIds?: string[];
  allowHttpsUnsubscribe?: boolean;
  allowMailtoUnsubscribe?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<QuietRequest>(request);
    if (!body.scanId) {
      throw new AppError({
        code: "SCAN_ID_REQUIRED",
        message: "A scan id is required to quiet senders.",
        status: 400,
      });
    }
    const store = getStore();
    const { userId, gmail, connection } = await requireGmailClient(store);
    const summary = await quietSenders({
      userId,
      scanRunId: body.scanId,
      candidateIds: body.candidateIds,
      gmail,
      store,
      grantedScopes: connection.scopes,
      allowHttpsUnsubscribe: body.allowHttpsUnsubscribe ?? true,
      allowMailtoUnsubscribe: body.allowMailtoUnsubscribe ?? false,
    });
    return jsonOk(summary, { degraded: summary.warnings.length > 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
