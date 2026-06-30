import { NextRequest, NextResponse } from 'next/server';
import { analyzeMood } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { moodScore, energyLevel, stressLevel, journalEntry } = body;

    if (
      typeof moodScore !== 'number' ||
      typeof energyLevel !== 'number' ||
      typeof stressLevel !== 'number'
    ) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const result = await analyzeMood({ moodScore, energyLevel, stressLevel, journalEntry });

    return NextResponse.json({
      insight: result.insight,
      coachingTip: result.coachingTip,
      pattern: result.patternDetected,
    });
  } catch (err: any) {
    console.error('[mood/check-in]', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
