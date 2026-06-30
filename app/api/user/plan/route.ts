import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: replace with real session + DB lookup once auth is wired up
  return NextResponse.json({
    plan: 'free',
    checkinsThisWeek: 0,
  });
}
