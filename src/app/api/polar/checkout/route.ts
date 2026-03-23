import { Checkout } from "@polar-sh/nextjs";

const baseURL = process.env.baseURL ?? "http://localhost:3000";

const checkoutHandler = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  successUrl: `${baseURL}/dashboard/nutrition?checkout=success`,
  returnUrl: `${baseURL}/dashboard/nutrition`,
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hasProducts = url.searchParams.get("products");

  if (!hasProducts) {
    const productId = process.env.POLAR_CREDITS_PRODUCT_ID;
    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Missing POLAR_CREDITS_PRODUCT_ID" }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
    url.searchParams.set("products", productId);
    return Response.redirect(url.toString(), 302);
  }

  // Delegate to Polar's Checkout handler when products are present
  // @ts-expect-error - the handler signature is compatible
  return checkoutHandler(req);
}

