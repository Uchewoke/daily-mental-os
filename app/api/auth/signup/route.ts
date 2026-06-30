import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { message: "Email and password (min 6 chars) are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { plan: "free" },
    });

    if (error) {
      console.error("[signup] Supabase error:", error.message);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.log("[signup] Created user:", data.user?.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[signup] Unhandled error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
