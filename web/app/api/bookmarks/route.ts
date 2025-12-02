import { createClient } from 'redis';
import { NextResponse } from 'next/server';

let redis: any = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL
    });
    await redis.connect();
  }
  return redis;
}

export async function GET() {
  try {
    const client = await getRedisClient();
    const bookmarks = await client.lRange('bookmarks', 0, -1);
    return NextResponse.json(bookmarks.map((b: string) => JSON.parse(b)));
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sitePassword = process.env.SITE_PASSWORD;
  const headerPassword = request.headers.get('x-site-password');

  if (sitePassword && headerPassword !== sitePassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, url, favicon } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Missing title or url' }, { status: 400 });
    }

    const newBookmark = {
      id: crypto.randomUUID(),
      title,
      url,
      favicon: favicon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`,
      date: new Date().toISOString(),
    };

    const client = await getRedisClient();
    await client.lPush('bookmarks', JSON.stringify(newBookmark));
    return NextResponse.json(newBookmark);
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sitePassword = process.env.SITE_PASSWORD;
  const headerPassword = request.headers.get('x-site-password');

  if (sitePassword && headerPassword !== sitePassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const client = await getRedisClient();
    const bookmarks = await client.lRange('bookmarks', 0, -1);
    const bookmarkToDelete = bookmarks.find((b: string) => JSON.parse(b).id === id);

    if (bookmarkToDelete) {
      await client.lRem('bookmarks', 1, bookmarkToDelete);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
