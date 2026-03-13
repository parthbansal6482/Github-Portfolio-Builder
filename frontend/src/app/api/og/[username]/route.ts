// OG image generation route — @vercel/og
// Full implementation in Task 22

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // TODO (Task 22): Generate OG image using @vercel/og
  return NextResponse.json({
    status: 'ok',
    route: `og/${username}`,
    message: 'OG image generation stub',
  });
}
