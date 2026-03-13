// Revalidation webhook — called by backend after publish/unpublish
// Full implementation in Task 17

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid revalidation secret' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { path } = body as { path?: string };

    if (!path) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to revalidate', message: err.message },
      { status: 500 }
    );
  }
}
