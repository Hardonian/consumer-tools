import { AppError } from "@/lib/errors";
import { handleApiError, jsonOk, readJsonBody } from "@/lib/api";
import { requireGmailClient } from "@/lib/auth/connection";
import { runScan } from "@/lib/services/scan";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

type ScanRequest = {
  maxMessages?: number;
  query?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<ScanRequest>(request);
    const maxMessages = body.maxMessages ?? 250;
    if (!Number.isInteger(maxMessages) || maxMessages < 10 || maxMessages > 500) {
      throw new AppError({
        code: "INVALID_SCAN_LIMIT",
        message: "Scan limit must be between 10 and 500 messages.",
        status: 400,
      });
    }

    const store = getStore();
    const { userId, gmail } = await requireGmailClient(store);
    const scan = await runScan({
      userId,
      gmail,
      store,
      query: body.query,
      maxMessages,
    });

    return jsonOk(scan, { degraded: scan.degraded });
  } catch (error) {
    return handleApiError(error);
  }
}
