import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  streamMoodAnalysis,
  parseStreamedMoodAnalysis,
  checkCrisisKeywords,
  CRISIS_RESOURCES,
} from '@/lib/claude';
import {
  getRecentCheckIns,
  getPatternHistoryContext,
  detectBreakthrough,
  insertCheckIn,
} from '@/lib/check-ins';

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache',
  'X-Accel-Buffering': 'no',
};

function immediateJsonStream(payload: unknown): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify(payload)));
      controller.close();
    },
  });
}

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

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    const userName = session?.user?.name || undefined;

    // Prompt 5 (crisis detection): the most explicit signals are checked
    // deterministically before any LLM call — this must never depend on
    // model judgment or be delayed by a round trip.
    if (checkCrisisKeywords(journalEntry)) {
      const crisisMessage = `I'm concerned about what you shared. This isn't something an app can help with — please reach out to someone today.\n\n${CRISIS_RESOURCES}`;

      if (userId) {
        await insertCheckIn({
          userId,
          moodScore,
          energyLevel,
          stressLevel,
          journalEntry,
          insight: crisisMessage,
          patternDetected: 'none',
          isCrisis: true,
        });
      }

      return new Response(
        immediateJsonStream({
          insight: crisisMessage,
          rootCause: '',
          microIntervention: '',
          patternDetected: 'none',
          isCrisis: true,
          crisisMessage,
          isBreakthrough: false,
        }),
        { headers: STREAM_HEADERS }
      );
    }

    // Prompts 4 & 6: pull recent history (only possible for signed-in users)
    // to enable pattern-aware coaching and breakthrough detection.
    let patternContext: { dominantPattern: string | null; pastWorkingSolution: string | null } | undefined;
    let isBreakthrough = false;

    if (userId) {
      const recentRows = await getRecentCheckIns(userId, 5);
      const { dominantPattern, pastWorkingSolution } = getPatternHistoryContext(recentRows);
      patternContext = { dominantPattern, pastWorkingSolution };
      isBreakthrough = detectBreakthrough(moodScore, recentRows);
    }

    const stream = streamMoodAnalysis(
      { moodScore, energyLevel, stressLevel, journalEntry, userName, patternContext, isBreakthrough },
      (fullText) => {
        if (!userId) return;
        // Fire-and-forget persistence once the stream finishes; failures are
        // logged but must not affect the response already sent to the client.
        try {
          const parsed = parseStreamedMoodAnalysis(fullText);
          insertCheckIn({
            userId,
            moodScore,
            energyLevel,
            stressLevel,
            journalEntry,
            insight: parsed.insight,
            rootCause: parsed.rootCause,
            microIntervention: parsed.microIntervention,
            patternDetected: parsed.patternDetected,
            isCrisis: parsed.isCrisis,
            isBreakthrough,
          }).catch((err) => console.error('[mood/check-in] persist failed:', err));
        } catch (err) {
          console.error('[mood/check-in] failed to parse final response for persistence:', err);
        }
      }
    );

    return new Response(stream, { headers: STREAM_HEADERS });
  } catch (err: any) {
    console.error('[mood/check-in]', err);
    const isOverloaded = err?.message?.includes('overloaded') || err?.message?.includes('Overloaded');
    return NextResponse.json(
      { message: isOverloaded ? 'Claude is busy right now. Please try again in a moment.' : (err.message || 'Server error') },
      { status: isOverloaded ? 503 : 500 }
    );
  }
}
