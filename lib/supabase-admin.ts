import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type UserPlan = "free" | "plus" | "pro";

export interface PlanMetadata {
  plan: UserPlan;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}
