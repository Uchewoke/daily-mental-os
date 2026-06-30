import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

  // TODO: replace with a real check-in count from a check_ins table once persistence is added
  return NextResponse.json({ plan, checkinsThisWeek: 0 });
}
