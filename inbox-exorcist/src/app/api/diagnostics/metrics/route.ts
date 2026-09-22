import { jsonOk } from "@/lib/api";
import { getCostMetrics, getCircuitBreaker } from "@/lib/diagnostics";
import { getRuntimeConfig } from "@/lib/config";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const metrics = getCostMetrics();
  const breaker = getCircuitBreaker("gmail-api");
  const config = getRuntimeConfig();
  const storage = await getStore().health();

  return jsonOk({
    timestamp: new Date().toISOString(),
    metrics,
    circuitBreaker: {
      state: breaker.currentState,
      isOpen: breaker.isOpen,
      isDegraded: breaker.isDegraded,
    },
    storage,
    environment: {
      paymentsEnabled: config.paymentsEnabled,
      googleOAuthConfigured: Boolean(config.googleClientId && config.googleClientSecret),
    },
  });
}
