import { jsonOk } from "@/lib/api";
import { getRuntimeConfig } from "@/lib/config";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const config = getRuntimeConfig();
  const storage = await getStore().health();
  const degraded =
    storage.degraded ||
    !config.googleClientId ||
    !config.googleClientSecret ||
    !config.sessionSecretConfigured ||
    !config.tokenEncryptionConfigured ||
    !config.piiHashSecretConfigured;

  return jsonOk(
    {
      service: "InboxExorcist",
      ok: !degraded,
      degraded,
      storage,
      googleOAuthConfigured: Boolean(
        config.googleClientId && config.googleClientSecret,
      ),
      securitySecretsConfigured: {
        session: config.sessionSecretConfigured,
        tokenEncryption: config.tokenEncryptionConfigured,
        piiHash: config.piiHashSecretConfigured,
      },
      paymentsEnabled: config.paymentsEnabled,
    },
    { degraded },
  );
}
