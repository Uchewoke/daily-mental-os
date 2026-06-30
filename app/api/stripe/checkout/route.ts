import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ALLOWED_PRICE_IDS = new Set([
  process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as { id?: string }).id) {
      return NextResponse.json({ message: "Please sign in first" }, { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
      return NextResponse.json({ message: "Invalid price" }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const userId = (session.user as { id: string }).id;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer_email: session.user.email ?? undefined,
      subscription_data: { metadata: { userId } },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
