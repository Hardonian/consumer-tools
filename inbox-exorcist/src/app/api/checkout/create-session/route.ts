import { NextRequest } from "next/server";
import { handleApiError, jsonOk } from "@/lib/api";
import { getRuntimeConfig } from "@/lib/config";
import { requireUserId } from "@/lib/auth/connection";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const config = getRuntimeConfig();
    const body = (await request.json().catch(() => ({}))) as {
      plan?: "one_time" | "subscription";
      returnUrl?: string;
    };

    const plan = body.plan || "one_time";
    const appUrl = config.appUrl.replace(/\/$/, "");
    const successUrl = `${appUrl}/scan?paid=1`;
    const cancelUrl = `${appUrl}/settings`;

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || !config.paymentsEnabled) {
      // Graceful simulated checkout response
      return jsonOk({
        simulated: true,
        plan,
        checkoutUrl: `${successUrl}&simulated=true`,
        message: "Payment gate simulated successfully.",
      });
    }

    // Live Stripe Checkout Session Creation via Stripe REST API
    const lineItems =
      plan === "subscription"
        ? [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "InboxExorcist Ongoing Shield",
                  description: "Continuous noise protection and auto-exorcism",
                },
                unit_amount: 300, // $3.00/month
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "InboxExorcist One-Time Clean",
                  description: "Full one-time inbox exorcism and reversible filtering",
                },
                unit_amount: 500, // $5.00 one-time
              },
              quantity: 1,
            },
          ];

    const formParams = new URLSearchParams();
    formParams.append("mode", plan === "subscription" ? "subscription" : "payment");
    formParams.append("success_url", `${successUrl}&session_id={CHECKOUT_SESSION_ID}`);
    formParams.append("cancel_url", cancelUrl);
    formParams.append("client_reference_id", userId);

    lineItems.forEach((item, index) => {
      formParams.append(`line_items[${index}][quantity]`, String(item.quantity));
      formParams.append(`line_items[${index}][price_data][currency]`, item.price_data.currency);
      formParams.append(
        `line_items[${index}][price_data][unit_amount]`,
        String(item.price_data.unit_amount),
      );
      formParams.append(
        `line_items[${index}][price_data][product_data][name]`,
        item.price_data.product_data.name,
      );
      formParams.append(
        `line_items[${index}][price_data][product_data][description]`,
        item.price_data.product_data.description,
      );
      if ("recurring" in item.price_data && typeof item.price_data.recurring === "object" && item.price_data.recurring && "interval" in item.price_data.recurring) {
        formParams.append(
          `line_items[${index}][price_data][recurring][interval]`,
          String((item.price_data.recurring as { interval: string }).interval),
        );
      }
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParams.toString(),
    });

    if (!response.ok) {
      return jsonOk(
        {
          simulated: true,
          plan,
          checkoutUrl: `${successUrl}&simulated=true`,
          warning: `Stripe API returned ${response.status}. Falling back to preview mode.`,
        },
        { degraded: true },
      );
    }

    const session = (await response.json()) as { url: string; id: string };
    return jsonOk({
      simulated: false,
      plan,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
