import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('content-type') || 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    // Enable CORS for the client
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(buffer, { headers });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
