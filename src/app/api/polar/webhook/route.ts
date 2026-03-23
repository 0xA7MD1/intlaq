import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { ingestCreditDelta, linkUserToPolarCustomerByEmail } from "@/server/utils/polar";

export const runtime = "nodejs";

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function getCreditsPerOrder(): number {
  const raw = process.env.POLAR_CREDITS_PER_ORDER;
  const n = raw ? Number(raw) : 30;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ error: "Missing POLAR_WEBHOOK_SECRET" }, { status: 500 });
  }

  let event: ReturnType<typeof validateEvent>;
  try {
    const body = Buffer.from(await req.arrayBuffer());
    event = validateEvent(body, headersToRecord(req.headers), secret);
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    console.error("Polar webhook parse/verify failed", { message: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  if (event.type !== "order.paid") {
    return NextResponse.json({ ok: true });
  }

  const order = event.data;
  const customerId = order.customerId ?? order.customer?.id;
  const customerEmail = order.customer?.email;

  if (!customerId || !customerEmail) {
    console.error("Polar order.paid missing customer info", { orderId: order?.id });
    return NextResponse.json({ ok: true });
  }

  const linked = await linkUserToPolarCustomerByEmail({
    email: customerEmail,
    customerId,
  });

  if (!linked) {
    console.warn("Polar order.paid: no matching user for email", { email: customerEmail, customerId });
    return NextResponse.json({ ok: true });
  }

  const credits = getCreditsPerOrder();
  try {
    await ingestCreditDelta({
      customerId,
      units: -credits,
      externalId: `order:${order.id}:grant`,
      description: `Grant ${credits} credits for order ${order.id}`,
    });
  } catch (e) {
    console.error("Polar credit grant failed", {
      userId: linked.userId,
      customerId,
      orderId: order.id,
      message: e instanceof Error ? e.message : String(e),
    });
  }

  return NextResponse.json({ ok: true });
}

