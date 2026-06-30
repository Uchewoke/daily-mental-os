import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin, type UserPlan } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function mapPriceIdToPlan(priceId: string | undefined): UserPlan {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) return "plus";
  return "free";
}

async function setUserPlan(userId: string, metadata: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.auth.admin.getUserById(userId);
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...existing?.user?.user_metadata, ...metadata },
  });
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json({ message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (!userId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = mapPriceIdToPlan(priceId);

        await setUserPlan(userId, {
          plan,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
        });
        console.log(`[stripe/webhook] User ${userId} upgraded to ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const plan = isActive ? mapPriceIdToPlan(priceId) : "free";

        await setUserPlan(userId, { plan });
        console.log(`[stripe/webhook] User ${userId} subscription updated -> ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await setUserPlan(userId, { plan: "free" });
        console.log(`[stripe/webhook] User ${userId} subscription canceled -> free`);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("[stripe/webhook] Handler error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
