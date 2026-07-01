import { NextRequest, NextResponse } from 'next/server';
import { runWeeklySynthesisJob } from '@/lib/weekly-synthesis-job';

// Hit by Vercel Cron (see vercel.json: Sundays at 13:00 UTC). Vercel
// automatically sends "Authorization: Bearer $CRON_SECRET" on cron-triggered
// requests when the CRON_SECRET env var is set on the project.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runWeeklySynthesisJob();
    return NextResponse.json({ processed: results.length, results });
  } catch (err: any) {
    console.error('[cron/weekly-synthesis]', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
