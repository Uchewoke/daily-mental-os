import { NextRequest, NextResponse } from 'next/server';
import { streamMoodAnalysis } from '@/lib/claude';

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

    const stream = streamMoodAnalysis({ moodScore, energyLevel, stressLevel, journalEntry });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    console.error('[mood/check-in]', err);
    const isOverloaded = err?.message?.includes('overloaded') || err?.message?.includes('Overloaded');
    return NextResponse.json(
      { message: isOverloaded ? 'Claude is busy right now. Please try again in a moment.' : (err.message || 'Server error') },
      { status: isOverloaded ? 503 : 500 }
    );
  }
}
