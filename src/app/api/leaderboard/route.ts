import { NextResponse } from 'next/server';
import { getLeaderboard, awardLeaderboardBonuses } from '@/lib/ghostpoints';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLeaderboard();
    return NextResponse.json({ success: true, leaderboard: data });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await awardLeaderboardBonuses();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Leaderboard award API error:', error);
    return NextResponse.json({ error: 'Failed to award bonuses' }, { status: 500 });
  }
}
