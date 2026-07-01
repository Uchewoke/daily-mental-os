import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCheckInCountThisWeek } from "@/lib/check-ins";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ plan: "free", checkinsThisWeek: 0 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    return NextResponse.json({ plan: "free", checkinsThisWeek: 0 });
  }

  const plan = (data.user.user_metadata?.plan as string) || "free";
  const checkinsThisWeek = await getCheckInCountThisWeek(userId);

  return NextResponse.json({ plan, checkinsThisWeek });
}
