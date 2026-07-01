import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { detectPatterns } from '@/lib/claude';
import { getRecentCheckIns } from '@/lib/check-ins';

// Prompt 2: pattern detection across a signed-in user's last 5 check-ins.
// Only meaningful once they have 3+ check-ins.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ pattern: null });
  }

  try {
    const rows = await getRecentCheckIns(userId, 5);
    if (rows.length < 3) {
      return NextResponse.json({ pattern: null });
    }

    const chronological = [...rows].reverse();
    const result = await detectPatterns(
      chronological.map((r) => ({
        moodScore: r.mood_score,
        energyLevel: r.energy_level,
        stressLevel: r.stress_level,
        journalEntry: r.journal_entry,
        createdAt: r.created_at,
      }))
    );

    return NextResponse.json({ pattern: result });
  } catch (err: any) {
    console.error('[mood/patterns]', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
