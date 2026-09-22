import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api";
import { getStore } from "@/lib/storage";
import { newId, nowIso } from "@/lib/ids";
import { safeLogInfo } from "@/lib/diagnostics";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const event = JSON.parse(rawBody || "{}") as {
      type?: string;
      data?: { object?: { client_reference_id?: string; customer_email?: string } };
    };

    const userId = event.data?.object?.client_reference_id;

    if (userId && (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded")) {
      const store = getStore();
      await store.recordActions({
        auditEvents: [
          {
            id: newId("audit"),
            userId,
            actor: "system",
            actionType: "payment_completed",
            result: "SUCCESS",
            createdAt: nowIso(),
          },
        ],
      });
      safeLogInfo("Payment processed for user", { userId, eventType: event.type });
    }

    return jsonOk({ received: true });
  } catch (error) {
    return jsonOk({ received: true, error: String(error) }, { degraded: true });
  }
}
