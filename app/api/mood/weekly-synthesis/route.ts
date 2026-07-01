import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { runWeeklySynthesisJob } from '@/lib/weekly-synthesis-job';

// Prompt 3: weekly synthesis email.
// GET  -> signed-in user views their latest stored synthesis in-app.
// POST -> manual trigger (bearer CRON_SECRET) for local testing; the
//         production schedule runs via GET /api/cron/weekly-synthesis (see
//         vercel.json), since Vercel Cron only issues GET requests.

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ synthesis: null });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('weekly_syntheses')
    .select('subject, body, week_start, created_at')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[weekly-synthesis GET]', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ synthesis: data || null });
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runWeeklySynthesisJob();
    return NextResponse.json({ processed: results.length, results });
  } catch (err: any) {
    console.error('[weekly-synthesis POST]', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
